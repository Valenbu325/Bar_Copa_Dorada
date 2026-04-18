package com.copadorada.backend.repository;

import com.copadorada.backend.dto.TableDto;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TableRepository {

    private final JdbcTemplate jdbcTemplate;

    public TableRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TableDto> findByBranch(Long branchId) {
        if (branchId == null) {
            return jdbcTemplate.query(
                "SELECT t.id, b.id AS branch_id, b.name AS branch_name, t.number FROM bar_tables t JOIN branches b ON b.id = t.branch_id ORDER BY b.name, t.number",
                (rs, rowNum) -> new TableDto(rs.getLong("id"), rs.getLong("branch_id"), rs.getString("branch_name"), rs.getString("number")));
        }
        return jdbcTemplate.query(
            "SELECT t.id, b.id AS branch_id, b.name AS branch_name, t.number FROM bar_tables t JOIN branches b ON b.id = t.branch_id WHERE t.branch_id = ? ORDER BY t.number",
            (rs, rowNum) -> new TableDto(rs.getLong("id"), rs.getLong("branch_id"), rs.getString("branch_name"), rs.getString("number")),
            branchId);
    }

    public long create(Long branchId, String number) {
        Long id = jdbcTemplate.queryForObject(
            "INSERT INTO bar_tables (branch_id, number) VALUES (?, ?) RETURNING id",
            Long.class, branchId, number);
        if (id == null) throw new IllegalStateException("Could not create table");
        return id;
    }

    public void delete(Long tableId) {
        jdbcTemplate.update("DELETE FROM bar_tables WHERE id = ?", tableId);
    }
}
