package com.whitecoder.retailpos.service;

import com.whitecoder.retailpos.dto.DashboardSummary;
import com.whitecoder.retailpos.dto.TopProductDto;
import com.whitecoder.retailpos.model.OrderItem;
import com.whitecoder.retailpos.model.OrderStatus;
import com.whitecoder.retailpos.repository.CustomerRepository;
import com.whitecoder.retailpos.repository.OrderItemRepository;
import com.whitecoder.retailpos.repository.OrderRepository;
import com.whitecoder.retailpos.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final MapperService mapper;

    public DashboardService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, ProductRepository productRepository, CustomerRepository customerRepository, MapperService mapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public DashboardSummary summary() {
        var orders = orderRepository.findAll().stream().filter(o -> o.getOrderStatus() == OrderStatus.COMPLETED).toList();
        LocalDate today = LocalDate.now();
        BigDecimal totalSales = orders.stream().map(o -> o.getGrandTotal()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal todaySales = orders.stream().filter(o -> o.getOrderDate().toLocalDate().equals(today)).map(o -> o.getGrandTotal()).reduce(BigDecimal.ZERO, BigDecimal::add);
        long todayOrders = orders.stream().filter(o -> o.getOrderDate().toLocalDate().equals(today)).count();
        Map<String, BigDecimal> lastSeven = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            BigDecimal dayTotal = orders.stream().filter(o -> o.getOrderDate().toLocalDate().equals(day)).map(o -> o.getGrandTotal()).reduce(BigDecimal.ZERO, BigDecimal::add);
            lastSeven.put(day.toString(), dayTotal);
        }
        Map<String, java.util.List<OrderItem>> grouped = orderItemRepository.findAll().stream().collect(Collectors.groupingBy(OrderItem::getProductName));
        var top = grouped.entrySet().stream().map(e -> new TopProductDto(
                e.getKey(),
                e.getValue().stream().mapToLong(OrderItem::getQuantity).sum(),
                e.getValue().stream().map(OrderItem::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add)
        )).sorted(Comparator.comparing(TopProductDto::total).reversed()).limit(5).toList();
        var lowStock = productRepository.findTop10ByStockQuantityLessThanEqualOrderByStockQuantityAsc(5).stream().map(mapper::product).toList();
        return new DashboardSummary(totalSales, todaySales, orders.size(), todayOrders, productRepository.count(), customerRepository.count(), lowStock, top, lastSeven);
    }
}
