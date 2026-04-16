package com.copadorada.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record ReportsDto(
        BigDecimal totalSales,
        List<BranchSalesDto> salesByBranch,
        List<InventoryStatusDto> inventoryStatus) {}

