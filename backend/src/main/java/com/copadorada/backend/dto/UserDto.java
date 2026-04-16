package com.copadorada.backend.dto;

public record UserDto(
        Long id,
        String fullName,
        String email,
        String role,
        Long branchId,
        String branchName,
        boolean active) {}

