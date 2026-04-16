package com.copadorada.backend.repository;

import com.copadorada.backend.dto.BranchSalesDto;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ReportRepository {

    private final JdbcTemplate jdbcTemplate;

    public ReportRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BranchSalesDto> salesByBranch() {
        String sql = """
                SELECT b.id AS branch_id, b.name AS branch_name, COALESCE(SUM(o.total_amount), 0) AS total_sales
                FROM branches b
                LEFT JOIN orders o ON o.branch_id = b.id
                LEFT JOIN status_catalog s ON s.id = o.status_id
                WHERE s.code = 'CLOSED' OR s.code IS NULL
                GROUP BY b.id, b.name
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new BranchSalesDto(
                        rs.getLong("branch_id"),
                        rs.getString("branch_name"),
                        rs.getBigDecimal("total_sales")));
    }

    public BigDecimal totalSales() {
        BigDecimal total = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(o.total_amount), 0)
                FROM orders o
                JOIN status_catalog s ON s.id = o.status_id
                WHERE s.code = 'CLOSED'
                """,
                BigDecimal.class);
        return total == null ? BigDecimal.ZERO : total;
    }
}

