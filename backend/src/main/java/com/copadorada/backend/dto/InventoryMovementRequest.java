package com.copadorada.backend.dto;

public record InventoryMovementRequest(
        Long branchId,
        Long productId,
        String movementType,
        Integer quantity,
        String reason,
        Long userId) {}

