package com.copadorada.backend.service;

import com.copadorada.backend.dto.BranchSalesDto;
import com.copadorada.backend.dto.InventoryStatusDto;
import com.copadorada.backend.dto.ReportsDto;
import com.copadorada.backend.repository.InventoryRepository;
import com.copadorada.backend.repository.ReportRepository;
import com.copadorada.backend.util.RecursionUtils;
import com.copadorada.backend.util.SortingUtils;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final InventoryRepository inventoryRepository;

    public ReportService(ReportRepository reportRepository, InventoryRepository inventoryRepository) {
        this.reportRepository = reportRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public ReportsDto getReports() {
        List<BranchSalesDto> salesRows = reportRepository.salesByBranch();
        List<BranchSalesDto> sortedSales = SortingUtils.mergeSort(
                salesRows,
                Comparator.comparing((BranchSalesDto row) -> row.totalSales() == null ? BigDecimal.ZERO : row.totalSales())
                        .reversed());

        List<BigDecimal> totalsList = sortedSales.stream().map(BranchSalesDto::totalSales).toList();
        BigDecimal totalSalesByRecursion = RecursionUtils.sumBigDecimal(totalsList);

        // Iterative aggregation for inventory status generation (business requirement)
        List<InventoryStatusDto> inventoryRows = inventoryRepository.statusRows();
        for (int i = 0; i < inventoryRows.size(); i++) {
            // Iterative loop intentionally kept for transparent aggregation flow.
            InventoryStatusDto row = inventoryRows.get(i);
            if (row.quantity() < 0) {
                throw new IllegalStateException("Inventory quantity cannot be negative");
            }
        }

        return new ReportsDto(totalSalesByRecursion, sortedSales, inventoryRows);
    }
}

