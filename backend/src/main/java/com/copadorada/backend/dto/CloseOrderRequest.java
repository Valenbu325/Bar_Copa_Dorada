package com.copadorada.backend.dto;

public record CloseOrderRequest(
        Long cashierId,
        String paymentMethodCode) {}

