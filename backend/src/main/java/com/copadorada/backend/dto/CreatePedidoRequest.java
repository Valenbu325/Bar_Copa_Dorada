package com.copadorada.backend.dto;

import java.math.BigDecimal;

public record CreatePedidoRequest(
        String sede, Long mesaId, String cliente, String items, BigDecimal total, String metodoPago) {}
