package com.copadorada.backend.dto;

import java.math.BigDecimal;

public record ProductDto(
        Long id,
        String sku,
        String name,
        String category,
        BigDecimal costPrice,
        BigDecimal salePrice,
        boolean active) {}

