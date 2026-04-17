package com.copadorada.backend.service;

import com.copadorada.backend.dto.CreateProductRequest;
import com.copadorada.backend.dto.ProductDto;
import com.copadorada.backend.repository.AuditRepository;
import com.copadorada.backend.repository.InventoryRepository;
import com.copadorada.backend.repository.ProductRepository;
import com.copadorada.backend.util.SortingUtils;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final AuditRepository auditRepository;
    private final InventoryRepository inventoryRepository;

    public ProductService(ProductRepository productRepository, AuditRepository auditRepository, InventoryRepository inventoryRepository) {
        this.productRepository = productRepository;
        this.auditRepository = auditRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public List<ProductDto> getProducts(String sort) {
        List<ProductDto> products = productRepository.findAll();
        if ("price".equalsIgnoreCase(sort)) {
            return SortingUtils.mergeSort(
                    products,
                    Comparator.comparing(p -> p.salePrice() == null ? BigDecimal.ZERO : p.salePrice()));
        }
        return products;
    }

    @Transactional
    public long createProduct(CreateProductRequest request) {
        if (request.sku() == null || request.sku().isBlank()) {
            throw new IllegalArgumentException("sku is required");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        if (request.categoryId() == null) {
            throw new IllegalArgumentException("categoryId is required");
        }
        if (request.costPrice() == null || request.salePrice() == null) {
            throw new IllegalArgumentException("costPrice and salePrice are required");
        }
        long id = productRepository.create(request);
        inventoryRepository.initForAllBranches(id);
        auditRepository.log(null, "CREATE_PRODUCT", "products", id, "Product created from UI");
        return id;
    }
}

