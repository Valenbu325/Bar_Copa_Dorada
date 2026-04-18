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

    private static final org.springframework.jdbc.core.RowMapper<InventoryItemDto> INV_ROW_MAPPER =
            (rs, rowNum) -> new InventoryItemDto(
                    rs.getLong("id"),
                    rs.getLong("branch_id"),
                    rs.getString("branch_name"),
                    rs.getLong("product_id"),
                    rs.getString("product_name"),
                    rs.getString("category"),
                    rs.getInt("quantity"));

    private static final String INV_SELECT = """
            SELECT i.id, b.id AS branch_id, b.name AS branch_name,
                   p.id AS product_id, p.name AS product_name, c.name AS category, i.quantity
            FROM inventory i
            JOIN branches b ON b.id = i.branch_id
            JOIN products p ON p.id = i.product_id
            JOIN categories c ON c.id = p.category_id
            """;

    public List<InventoryItemDto> getInventory(Long branchId) {
        if (branchId == null) {
            return jdbcTemplate.query(INV_SELECT + "ORDER BY p.name", INV_ROW_MAPPER);
        }
        return jdbcTemplate.query(
                INV_SELECT + "WHERE b.id = ? ORDER BY p.name",
                INV_ROW_MAPPER,
                branchId);
    }

    public int getQuantity(Long branchId, Long productId) {
        List<Integer> rows = jdbcTemplate.query(
                "SELECT quantity FROM inventory WHERE branch_id = ? AND product_id = ?",
                (rs, rowNum) -> rs.getInt("quantity"),
                branchId,
                productId);
        return rows.isEmpty() ? 0 : rows.get(0);
    }

    public void updateStock(Long branchId, Long productId, int delta) {
        jdbcTemplate.update(
                """
                INSERT INTO inventory (branch_id, product_id, quantity)
                VALUES (?, ?, ?)
                ON CONFLICT (branch_id, product_id)
                DO UPDATE SET quantity = inventory.quantity + ?, updated_at = NOW()
                """,
                branchId,
                productId,
                delta,
                delta);
    }

    public void saveMovement(Long branchId, Long productId, String movementType, int quantity, String reason, Long userId) {
        jdbcTemplate.update(
                """
                INSERT INTO inventory_movements (branch_id, product_id, movement_type, quantity, reason, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                branchId,
                productId,
                movementType,
                quantity,
                reason,
                userId);
    }

    public void resetStock(Long inventoryId) {
        jdbcTemplate.update("UPDATE inventory SET quantity = 0 WHERE id = ?", inventoryId);
    }

    public void initializeForAllBranches(long productId) {
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

