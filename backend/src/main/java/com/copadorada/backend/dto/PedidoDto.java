package com.copadorada.backend.dto;

import java.math.BigDecimal;

public record PedidoDto(
        Long id,
        String sede,
        String mesa,
        String cliente,
        String items,
        BigDecimal total,
        String estado,
        String metodoPago) {}
