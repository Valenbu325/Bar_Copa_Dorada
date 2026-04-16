package com.copadorada.backend.controller;

import com.copadorada.backend.dto.CloseOrderRequest;
import com.copadorada.backend.dto.CreateOrderRequest;
import com.copadorada.backend.dto.OrderDto;
import com.copadorada.backend.service.OrderService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrdersController {

    private final OrderService orderService;

    public OrdersController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderDto> getOrders(@RequestParam(value = "branchId", required = false) Long branchId) {
        return orderService.getOrders(branchId);
    }

    @PostMapping
    public OrderDto createOrder(@RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    @PutMapping("/{id}/close")
    public OrderDto closeOrder(@PathVariable("id") Long id, @RequestBody CloseOrderRequest request) {
        return orderService.closeOrder(id, request);
    }
}

