package com.copadorada.backend.dto;

import java.util.List;

public record CreateOrderRequest(
        Long branchId,
        Long waiterId,
        Long tableId,
        String notes,
        List<CreateOrderItemRequest> items) {}

