package com.copadorada.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuditRepository {

    private final JdbcTemplate jdbcTemplate;

    public AuditRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void log(Long userId, String action, String entity, Long entityId, String details) {
        jdbcTemplate.update(
                """
                INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
                VALUES (?, ?, ?, ?, ?)
                """,
                userId,
                action,
                entity,
                entityId,
                details);
    }
}

