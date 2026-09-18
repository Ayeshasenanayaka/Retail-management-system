package com.whitecoder.retailpos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDto(
        Long orderId,
        String invoiceNo,
        Long customerId,
        String customerName,
        String customerPhone,
        String cashierName,
        LocalDateTime orderDate,
        BigDecimal subTotal,
        BigDecimal discount,
        BigDecimal grandTotal,
        String orderStatus,
        String notes,
        List<OrderItemDto> items,
        PaymentDto payment
) {
}
