package com.copadorada.backend.controller;

import com.copadorada.backend.dto.CreateProductRequest;
import com.copadorada.backend.dto.InventoryItemDto;
import com.copadorada.backend.dto.InventoryMovementRequest;
import com.copadorada.backend.dto.ProductDto;
import com.copadorada.backend.service.InventoryService;
import com.copadorada.backend.service.ProductService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private final ProductService productService;
    private final InventoryService inventoryService;

    public InventoryController(ProductService productService, InventoryService inventoryService) {
        this.productService = productService;
        this.inventoryService = inventoryService;
    }

    @GetMapping("/products")
    public List<ProductDto> getProducts(@RequestParam(value = "sort", required = false) String sort) {
        return productService.getProducts(sort);
    }

    @PostMapping("/products")
    public ResponseEntity<Map<String, Long>> createProduct(@RequestBody CreateProductRequest request) {
        long id = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    @GetMapping("/inventory")
    public List<InventoryItemDto> getInventory(@RequestParam(value = "branchId", required = false) Long branchId) {
        return inventoryService.getInventory(branchId);
    }

    @PostMapping("/inventory/movements")
    public ResponseEntity<Void> addMovement(@RequestBody InventoryMovementRequest request) {
        inventoryService.createMovement(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}

