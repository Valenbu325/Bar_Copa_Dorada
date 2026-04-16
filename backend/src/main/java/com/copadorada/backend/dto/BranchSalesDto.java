package com.copadorada.backend.dto;

import java.math.BigDecimal;

public record BranchSalesDto(Long branchId, String branchName, BigDecimal totalSales) {}

