package com.copadorada.backend.repository;

import com.copadorada.backend.dto.CreateUserRequest;
import com.copadorada.backend.dto.UserDto;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<UserDto> findAll() {
        String sql = """
                SELECT u.id, u.full_name, u.email, r.code AS role_code, b.id AS branch_id, b.name AS branch_name, u.active
                FROM users u
                JOIN roles r ON r.id = u.role_id
                JOIN branches b ON b.id = u.branch_id
                ORDER BY u.id DESC
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new UserDto(
                        rs.getLong("id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("role_code"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_name"),
                        rs.getBoolean("active")));
    }

    public long create(CreateUserRequest request) {
        Long roleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = ?",
                Long.class,
                request.roleCode());
        if (roleId == null) {
            throw new IllegalArgumentException("Role not found");
        }
        Long id = jdbcTemplate.queryForObject(
                """
                INSERT INTO users (full_name, email, password, role_id, branch_id)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                request.fullName(),
                request.email(),
                request.password(),
                roleId,
                request.branchId());
        if (id == null) {
            throw new IllegalStateException("Could not create user");
        }
        return id;
    }

    public String findRoleCodeByUserId(Long userId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT r.code
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE u.id = ?
                """,
                String.class,
                userId);
    }

    public Long findBranchIdByUserId(Long userId) {
        return jdbcTemplate.queryForObject(
                "SELECT branch_id FROM users WHERE id = ?",
                Long.class,
                userId);
    }
}

