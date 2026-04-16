package com.copadorada.backend.dto;

public record InventoryItemDto(
        Long inventoryId,
        Long branchId,
        String branchName,
        Long productId,
        String productName,
        String category,
        Integer quantity) {}

