package com.copadorada.backend.repository;

import com.copadorada.backend.dto.LoginResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuthRepository {

    private final JdbcTemplate jdbcTemplate;

    public AuthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<LoginResponse> login(String email, String password) {
        String sql = """
                SELECT u.id,
                       u.full_name AS nombre,
                       u.email,
                       r.code AS rol,
                       b.name AS sede
                FROM users u
                JOIN roles r ON r.id = u.role_id
                JOIN branches b ON b.id = u.branch_id
                WHERE u.email = ? AND u.password = ? AND u.active = TRUE
                """;
        List<LoginResponse> rows = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new LoginResponse(
                        rs.getLong("id"),
                        rs.getString("nombre"),
                        rs.getString("email"),
                        rs.getString("rol"),
                        rs.getString("sede")),
                email,
                password);
        return rows.stream().findFirst();
    }
}

