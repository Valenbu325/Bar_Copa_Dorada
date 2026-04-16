package com.copadorada.backend.dto;

import java.math.BigDecimal;

public record CreateProductRequest(
        String sku,
        String name,
        Long categoryId,
        BigDecimal costPrice,
        BigDecimal salePrice) {}

