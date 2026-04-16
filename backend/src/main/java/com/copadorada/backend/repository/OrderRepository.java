package com.copadorada.backend.repository;

import com.copadorada.backend.dto.OrderDetailDto;
import com.copadorada.backend.dto.OrderDto;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbcTemplate;

    public OrderRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long createOrder(Long branchId, Long waiterId, Long statusId, String notes) {
        Long id = jdbcTemplate.queryForObject(
                """
                INSERT INTO orders (branch_id, waiter_id, status_id, notes)
                VALUES (?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                branchId,
                waiterId,
                statusId,
                notes);
        if (id == null) {
            throw new IllegalStateException("Could not create order");
        }
        return id;
    }

    public void addDetail(Long orderId, Long productId, Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
        jdbcTemplate.update(
                """
                INSERT INTO order_details (order_id, product_id, quantity, unit_price, line_total)
                VALUES (?, ?, ?, ?, ?)
                """,
                orderId,
                productId,
                quantity,
                unitPrice,
                lineTotal);
    }

    public void updateOrderTotal(Long orderId, BigDecimal total) {
        jdbcTemplate.update("UPDATE orders SET total_amount = ? WHERE id = ?", total, orderId);
    }

    public Long getStatusId(String statusCode) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM status_catalog WHERE module = 'ORDER' AND code = ?",
                Long.class,
                statusCode);
    }

    public String getOrderStatusCode(Long orderId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT s.code
                FROM orders o
                JOIN status_catalog s ON s.id = o.status_id
                WHERE o.id = ?
                """,
                String.class,
                orderId);
    }

    public void closeOrder(Long orderId, Long closedStatusId) {
        jdbcTemplate.update(
                "UPDATE orders SET status_id = ?, closed_at = NOW() WHERE id = ?",
                closedStatusId,
                orderId);
    }

    public void savePayment(Long orderId, Long paymentMethodId, BigDecimal amount, Long cashierId) {
        jdbcTemplate.update(
                """
                INSERT INTO payments (order_id, payment_method_id, amount, paid_by)
                VALUES (?, ?, ?, ?)
                """,
                orderId,
                paymentMethodId,
                amount,
                cashierId);
    }

    public Long getPaymentMethodId(String methodCode) {
        return jdbcTemplate.queryForObject("SELECT id FROM payment_methods WHERE code = ?", Long.class, methodCode);
    }

    public List<OrderDto> listOrders(Long branchId) {
        String sql = """
                SELECT o.id, b.id AS branch_id, b.name AS branch_name,
                       u.id AS waiter_id, u.full_name AS waiter_name,
                       s.code AS status_code,
                       o.total_amount, o.created_at, o.closed_at
                FROM orders o
                JOIN branches b ON b.id = o.branch_id
                JOIN users u ON u.id = o.waiter_id
                JOIN status_catalog s ON s.id = o.status_id
                WHERE (? IS NULL OR o.branch_id = ?)
                ORDER BY o.id DESC
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new OrderDto(
                        rs.getLong("id"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_name"),
                        rs.getLong("waiter_id"),
                        rs.getString("waiter_name"),
                        rs.getString("status_code"),
                        rs.getBigDecimal("total_amount"),
                        toInstant(rs.getTimestamp("created_at")),
                        toInstant(rs.getTimestamp("closed_at")),
                        List.of()),
                branchId,
                branchId);
    }

    public Optional<OrderDto> findOrder(Long orderId) {
        String sql = """
                SELECT o.id, b.id AS branch_id, b.name AS branch_name,
                       u.id AS waiter_id, u.full_name AS waiter_name,
                       s.code AS status_code,
                       o.total_amount, o.created_at, o.closed_at
                FROM orders o
                JOIN branches b ON b.id = o.branch_id
                JOIN users u ON u.id = o.waiter_id
                JOIN status_catalog s ON s.id = o.status_id
                WHERE o.id = ?
                """;
        List<OrderDto> rows = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new OrderDto(
                        rs.getLong("id"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_name"),
                        rs.getLong("waiter_id"),
                        rs.getString("waiter_name"),
                        rs.getString("status_code"),
                        rs.getBigDecimal("total_amount"),
                        toInstant(rs.getTimestamp("created_at")),
                        toInstant(rs.getTimestamp("closed_at")),
                        new ArrayList<>()),
                orderId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        OrderDto base = rows.get(0);
        List<OrderDetailDto> details = jdbcTemplate.query(
                """
                SELECT d.product_id, p.name AS product_name, d.quantity, d.unit_price, d.line_total
                FROM order_details d
                JOIN products p ON p.id = d.product_id
                WHERE d.order_id = ?
                ORDER BY d.id
                """,
                (rs, rowNum) -> new OrderDetailDto(
                        rs.getLong("product_id"),
                        rs.getString("product_name"),
                        rs.getInt("quantity"),
                        rs.getBigDecimal("unit_price"),
                        rs.getBigDecimal("line_total")),
                orderId);
        return Optional.of(new OrderDto(
                base.id(),
                base.branchId(),
                base.branchName(),
                base.waiterId(),
                base.waiterName(),
                base.status(),
                base.totalAmount(),
                base.createdAt(),
                base.closedAt(),
                details));
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}

