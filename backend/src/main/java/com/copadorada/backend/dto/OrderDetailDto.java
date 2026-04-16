package com.copadorada.backend.dto;

import java.math.BigDecimal;

public record OrderDetailDto(
        Long productId,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal) {}

