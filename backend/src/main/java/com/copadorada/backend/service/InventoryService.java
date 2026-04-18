package com.copadorada.backend.service;

import com.copadorada.backend.dto.InventoryItemDto;
import com.copadorada.backend.dto.InventoryMovementRequest;
import com.copadorada.backend.repository.AuditRepository;
import com.copadorada.backend.repository.InventoryRepository;
import com.copadorada.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final AuditRepository auditRepository;
    private final UserRepository userRepository;

    public InventoryService(InventoryRepository inventoryRepository, AuditRepository auditRepository, UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.auditRepository = auditRepository;
        this.userRepository = userRepository;
    }

    public List<InventoryItemDto> getInventory(Long branchId) {
        return inventoryRepository.getInventory(branchId);
    }

    public void resetStock(Long inventoryId) {
        inventoryRepository.resetStock(inventoryId);
    }

    @Transactional
    public void createMovement(InventoryMovementRequest request) {
        if (request.branchId() == null || request.productId() == null || request.quantity() == null) {
            throw new IllegalArgumentException("branchId, productId and quantity are required");
        }
        if (request.quantity() <= 0) {
            throw new IllegalArgumentException("quantity must be > 0");
        }
        if (request.userId() == null) {
            throw new IllegalArgumentException("userId is required");
        }
        String movementType = request.movementType() == null ? "" : request.movementType().toUpperCase();
        if (!"IN".equals(movementType) && !"OUT".equals(movementType)) {
            throw new IllegalArgumentException("movementType must be IN or OUT");
        }
        String role = userRepository.findRoleCodeByUserId(request.userId());
        if (!"CASHIER".equals(role) && !"ADMIN".equals(role)) {
            throw new IllegalArgumentException("Only CASHIER or ADMIN can move inventory");
        }
        Long userBranchId = userRepository.findBranchIdByUserId(request.userId());
        if (!"ADMIN".equals(role) && !request.branchId().equals(userBranchId)) {
            throw new IllegalArgumentException("You can only move inventory in your branch");
        }

        int signedDelta = "IN".equals(movementType) ? request.quantity() : -request.quantity();
        int currentQty = inventoryRepository.getQuantity(request.branchId(), request.productId());
        if ("OUT".equals(movementType) && currentQty < request.quantity()) {
            throw new IllegalArgumentException("Insufficient inventory");
        }

        inventoryRepository.updateStock(request.branchId(), request.productId(), signedDelta);
        inventoryRepository.saveMovement(
                request.branchId(),
                request.productId(),
                movementType,
                request.quantity(),
                request.reason(),
                request.userId());
        auditRepository.log(request.userId(), "INVENTORY_MOVEMENT", "inventory_movements", null, movementType + " qty " + request.quantity());
    }
}

