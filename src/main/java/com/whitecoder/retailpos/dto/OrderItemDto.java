package com.whitecoder.retailpos.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        Long orderItemId,
        Long productId,
        String productName,
        String barcode,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal discount,
        BigDecimal totalPrice
) {
}
