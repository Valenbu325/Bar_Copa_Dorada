package com.copadorada.backend.controller;

import com.copadorada.backend.dto.ReportsDto;
import com.copadorada.backend.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final ReportService reportService;

    public ReportsController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ReportsDto getReports() {
        return reportService.getReports();
    }
}

