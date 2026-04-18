package com.copadorada.backend.controller;

import com.copadorada.backend.dto.BranchDto;
import com.copadorada.backend.dto.CategoryDto;
import com.copadorada.backend.dto.RoleDto;
import com.copadorada.backend.service.LookupService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LookupController {

    private final LookupService lookupService;

    public LookupController(LookupService lookupService) {
        this.lookupService = lookupService;
    }

    @GetMapping("/branches")
    public List<BranchDto> branches() {
        return lookupService.getBranches();
    }

    @GetMapping("/roles")
    public List<RoleDto> roles() {
        return lookupService.getRoles();
    }

    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return lookupService.getCategories();
    }
}

