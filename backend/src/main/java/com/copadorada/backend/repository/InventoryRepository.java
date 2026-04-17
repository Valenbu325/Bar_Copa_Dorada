package com.copadorada.backend.repository;

import com.copadorada.backend.dto.InventoryItemDto;
import com.copadorada.backend.dto.InventoryStatusDto;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class InventoryRepository {

    private final JdbcTemplate jdbcTemplate;

    public InventoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<InventoryItemDto> getInventory(Long branchId) {
        String sql = """
                SELECT i.id, b.id AS branch_id, b.name AS branch_name,
                       p.id AS product_id, p.name AS product_name, c.name AS category, i.quantity
                FROM inventory i
                JOIN branches b ON b.id = i.branch_id
                JOIN products p ON p.id = i.product_id
                JOIN categories c ON c.id = p.category_id
                WHERE (? IS NULL OR b.id = ?)
                ORDER BY p.name
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new InventoryItemDto(
                        rs.getLong("id"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_name"),
                        rs.getLong("product_id"),
                        rs.getString("product_name"),
                        rs.getString("category"),
                        rs.getInt("quantity")),
                branchId,
                branchId);
    }

    public int getQuantity(Long branchId, Long productId) {
        Integer quantity = jdbcTemplate.queryForObject(
                "SELECT quantity FROM inventory WHERE branch_id = ? AND product_id = ?",
                Integer.class,
                branchId,
                productId);
        return quantity == null ? 0 : quantity;
    }

    public void updateStock(Long branchId, Long productId, int delta) {
        jdbcTemplate.update(
                """
                UPDATE inventory
                SET quantity = quantity + ?, updated_at = NOW()
                WHERE branch_id = ? AND product_id = ?
                """,
                delta,
                branchId,
                productId);
    }

    public void saveMovement(Long branchId, Long productId, String movementType, int quantity, String reason, Long userId) {
        Long inventoryId = jdbcTemplate.queryForObject(
                "SELECT id FROM inventory WHERE branch_id = ? AND product_id = ?",
                Long.class, branchId, productId);
        jdbcTemplate.update(
                """
                INSERT INTO inventory_movements (inventory_id, branch_id, product_id, movement_type, quantity, reason, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                inventoryId,
                branchId,
                productId,
                movementType,
                quantity,
                reason,
                userId);
    }

    public void initForAllBranches(Long productId) {
        jdbcTemplate.update(
                """
                INSERT INTO inventory (branch_id, product_id, quantity)
                SELECT id, ?, 0 FROM branches
                ON CONFLICT (branch_id, product_id) DO NOTHING
                """,
                productId);
    }

    public List<InventoryStatusDto> statusRows() {
        String sql = """
                SELECT b.id AS branch_id, b.name AS branch_name, p.id AS product_id, p.name AS product_name, i.quantity
                FROM inventory i
                JOIN branches b ON b.id = i.branch_id
                JOIN products p ON p.id = i.product_id
                ORDER BY b.name, p.name
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new InventoryStatusDto(
                        rs.getLong("branch_id"),
                        rs.getString("branch_name"),
                        rs.getLong("product_id"),
                        rs.getString("product_name"),
                        rs.getInt("quantity")));
    }
}

