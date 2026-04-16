package com.copadorada.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
        Long id,
        Long branchId,
        String branchName,
        Long waiterId,
        String waiterName,
        String status,
        BigDecimal totalAmount,
        Instant createdAt,
        Instant closedAt,
        List<OrderDetailDto> details) {}

