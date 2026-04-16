package com.copadorada.backend.dto;

public record CreateUserRequest(
        String fullName,
        String email,
        String password,
        String roleCode,
        Long branchId) {}

