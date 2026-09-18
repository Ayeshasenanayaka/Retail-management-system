package com.whitecoder.retailpos.service;

import com.whitecoder.retailpos.dto.*;
import com.whitecoder.retailpos.model.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MapperService {
    public UserDto user(UserAccount u) {
        return new UserDto(u.getUserId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getRole().name());
    }

    public CategoryDto category(Category c) {
        return new CategoryDto(c.getCategoryId(), c.getCategoryName(), c.getDescription(), c.isStatus(), c.getCreatedAt(), c.getUpdatedAt());
    }

    public ProductDto product(Product p) {
        return new ProductDto(p.getProductId(), p.getCategory().getCategoryId(), p.getCategory().getCategoryName(), p.getProductName(), p.getDescription(), p.getPrice(), p.getStockQuantity(), p.getBarcode(), p.getImageUrl(), p.isStatus(), p.getCreatedAt(), p.getUpdatedAt());
    }

    public CustomerDto customer(Customer c) {
        return new CustomerDto(c.getCustomerId(), c.getName(), c.getPhone(), c.getEmail(), c.getAddress(), c.getCreatedAt());
    }

    public OrderDto order(SaleOrder o) {
        Customer c = o.getCustomer();
        Payment payment = o.getPayment();
        List<OrderItemDto> items = o.getItems().stream().map(this::orderItem).toList();
        PaymentDto paymentDto = payment == null ? null : new PaymentDto(payment.getPaymentId(), payment.getPaymentMethod().name(), payment.getAmount(), payment.getTenderedAmount(), payment.getBalanceAmount(), payment.getTransactionId(), payment.getCardHolderName(), payment.getCardLastFour(), payment.getCardReferenceNo(), payment.getPaymentDate(), payment.getStatus().name());
        return new OrderDto(
                o.getOrderId(),
                o.getInvoiceNo(),
                c == null ? null : c.getCustomerId(),
                c == null ? "Walk-in Customer" : c.getName(),
                c == null ? "" : c.getPhone(),
                o.getCashier().getFullName(),
                o.getOrderDate(),
                o.getSubTotal(),
                o.getDiscount(),
                o.getGrandTotal(),
                o.getOrderStatus().name(),
                o.getNotes(),
                items,
                paymentDto
        );
    }

    public OrderItemDto orderItem(OrderItem i) {
        return new OrderItemDto(i.getOrderItemId(), i.getProduct().getProductId(), i.getProductName(), i.getBarcode(), i.getQuantity(), i.getUnitPrice(), i.getDiscount(), i.getTotalPrice());
    }
}
