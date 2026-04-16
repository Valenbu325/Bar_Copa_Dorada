package com.copadorada.backend.service;

import com.copadorada.backend.dto.CloseOrderRequest;
import com.copadorada.backend.dto.CreateOrderItemRequest;
import com.copadorada.backend.dto.CreateOrderRequest;
import com.copadorada.backend.dto.OrderDto;
import com.copadorada.backend.dto.ProductDto;
import com.copadorada.backend.repository.AuditRepository;
import com.copadorada.backend.repository.InventoryRepository;
import com.copadorada.backend.repository.OrderRepository;
import com.copadorada.backend.repository.ProductRepository;
import com.copadorada.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditRepository auditRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            AuditRepository auditRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.auditRepository = auditRepository;
        this.userRepository = userRepository;
    }

    public List<OrderDto> getOrders(Long branchId) {
        return orderRepository.listOrders(branchId);
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request) {
        if (request.branchId() == null || request.waiterId() == null) {
            throw new IllegalArgumentException("branchId and waiterId are required");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("items are required");
        }
        String role = userRepository.findRoleCodeByUserId(request.waiterId());
        if (!"WAITER".equals(role) && !"CASHIER".equals(role) && !"ADMIN".equals(role)) {
            throw new IllegalArgumentException("Invalid user role to create orders");
        }
        Long userBranchId = userRepository.findBranchIdByUserId(request.waiterId());
        if (!"ADMIN".equals(role) && !request.branchId().equals(userBranchId)) {
            throw new IllegalArgumentException("You can only create orders in your branch");
        }

        List<Long> productIds = new ArrayList<>();
        for (CreateOrderItemRequest item : request.items()) {
            if (item.productId() == null || item.quantity() == null || item.quantity() <= 0) {
                throw new IllegalArgumentException("Invalid item payload");
            }
            productIds.add(item.productId());
        }
        Map<Long, ProductDto> productMap = productRepository.findByIds(productIds);
        if (productMap.size() != productIds.size()) {
            throw new IllegalArgumentException("Some products were not found");
        }

        Long openStatusId = orderRepository.getStatusId("OPEN");
        long orderId = orderRepository.createOrder(request.branchId(), request.waiterId(), openStatusId, request.notes());

        BigDecimal total = BigDecimal.ZERO;
        for (CreateOrderItemRequest item : request.items()) {
            ProductDto product = productMap.get(item.productId());
            int available = inventoryRepository.getQuantity(request.branchId(), item.productId());
            if (available < item.quantity()) {
                throw new IllegalArgumentException("Insufficient inventory for " + product.name());
            }

            BigDecimal lineTotal = product.salePrice().multiply(BigDecimal.valueOf(item.quantity()));
            total = total.add(lineTotal);

            orderRepository.addDetail(orderId, item.productId(), item.quantity(), product.salePrice(), lineTotal);
            inventoryRepository.updateStock(request.branchId(), item.productId(), -item.quantity());
            inventoryRepository.saveMovement(
                    request.branchId(),
                    item.productId(),
                    "OUT",
                    item.quantity(),
                    "Order #" + orderId,
                    request.waiterId());
        }
        orderRepository.updateOrderTotal(orderId, total);
        auditRepository.log(request.waiterId(), "CREATE_ORDER", "orders", orderId, "Created from UI");
        return orderRepository.findOrder(orderId).orElseThrow();
    }

    @Transactional
    public OrderDto closeOrder(Long orderId, CloseOrderRequest request) {
        if (request.cashierId() == null || request.paymentMethodCode() == null || request.paymentMethodCode().isBlank()) {
            throw new IllegalArgumentException("cashierId and paymentMethodCode are required");
        }
        String role = userRepository.findRoleCodeByUserId(request.cashierId());
        if (!"CASHIER".equals(role) && !"ADMIN".equals(role)) {
            throw new IllegalArgumentException("Only CASHIER or ADMIN can close orders");
        }
        String status = orderRepository.getOrderStatusCode(orderId);
        if (!"OPEN".equals(status)) {
            throw new IllegalArgumentException("Closed orders cannot be modified");
        }
        OrderDto currentOrder = orderRepository.findOrder(orderId).orElseThrow();
        Long userBranchId = userRepository.findBranchIdByUserId(request.cashierId());
        if (!"ADMIN".equals(role) && !currentOrder.branchId().equals(userBranchId)) {
            throw new IllegalArgumentException("You can only close orders in your branch");
        }

        Long closedStatusId = orderRepository.getStatusId("CLOSED");
        orderRepository.closeOrder(orderId, closedStatusId);
        OrderDto closedOrder = orderRepository.findOrder(orderId).orElseThrow();
        Long paymentMethodId = orderRepository.getPaymentMethodId(request.paymentMethodCode().toUpperCase());
        orderRepository.savePayment(orderId, paymentMethodId, closedOrder.totalAmount(), request.cashierId());
        auditRepository.log(request.cashierId(), "CLOSE_ORDER", "orders", orderId, "Closed with payment");
        return orderRepository.findOrder(orderId).orElseThrow();
    }
}

