package com.whitecoder.retailpos.controller;

import com.whitecoder.retailpos.dto.OrderCreateRequest;
import com.whitecoder.retailpos.dto.OrderDto;
import com.whitecoder.retailpos.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderDto> latest() {
        return orderService.latest();
    }

    @GetMapping("/{id}")
    public OrderDto get(@PathVariable Long id) {
        return orderService.get(id);
    }

    @PostMapping
    public OrderDto create(@Valid @RequestBody OrderCreateRequest request) {
        return orderService.create(request);
    }
}
