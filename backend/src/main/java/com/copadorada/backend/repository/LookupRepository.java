package com.copadorada.backend.repository;

import com.copadorada.backend.dto.BranchDto;
import com.copadorada.backend.dto.RoleDto;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class LookupRepository {

    private final JdbcTemplate jdbcTemplate;

    public LookupRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RoleDto> getRoles() {
        return jdbcTemplate.query(
                "SELECT id, code, name FROM roles ORDER BY id",
                (rs, rowNum) -> new RoleDto(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")));
    }

    public List<BranchDto> getBranches() {
        return jdbcTemplate.query(
                "SELECT id, code, name FROM branches ORDER BY id",
                (rs, rowNum) -> new BranchDto(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")));
    }
}

