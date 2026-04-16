package com.copadorada.backend.dto;

public record InventoryStatusDto(
        Long branchId,
        String branchName,
        Long productId,
        String productName,
        Integer quantity) {}

