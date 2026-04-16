package com.copadorada.backend.repository;

import com.copadorada.backend.dto.CreateProductRequest;
import com.copadorada.backend.dto.ProductDto;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

    private final JdbcTemplate jdbcTemplate;

    public ProductRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ProductDto> findAll() {
        String sql = """
                SELECT p.id, p.sku, p.name, c.name AS category, p.cost_price, p.sale_price, p.active
                FROM products p
                JOIN categories c ON c.id = p.category_id
                ORDER BY p.id DESC
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new ProductDto(
                        rs.getLong("id"),
                        rs.getString("sku"),
                        rs.getString("name"),
                        rs.getString("category"),
                        rs.getBigDecimal("cost_price"),
                        rs.getBigDecimal("sale_price"),
                        rs.getBoolean("active")));
    }

    public long create(CreateProductRequest request) {
        Long id = jdbcTemplate.queryForObject(
                """
                INSERT INTO products (sku, name, category_id, cost_price, sale_price)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                request.sku(),
                request.name(),
                request.categoryId(),
                request.costPrice(),
                request.salePrice());
        if (id == null) {
            throw new IllegalStateException("Could not create product");
        }
        return id;
    }

    public Map<Long, ProductDto> findByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        String sql = """
                SELECT p.id, p.sku, p.name, c.name AS category, p.cost_price, p.sale_price, p.active
                FROM products p
                JOIN categories c ON c.id = p.category_id
                WHERE p.id IN (%s)
                """.formatted(placeholders);
        List<ProductDto> rows = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new ProductDto(
                        rs.getLong("id"),
                        rs.getString("sku"),
                        rs.getString("name"),
                        rs.getString("category"),
                        rs.getBigDecimal("cost_price"),
                        rs.getBigDecimal("sale_price"),
                        rs.getBoolean("active")),
                ids.toArray());
        Map<Long, ProductDto> out = new HashMap<>();
        for (ProductDto row : rows) {
            out.put(row.id(), row);
        }
        return out;
    }
}

