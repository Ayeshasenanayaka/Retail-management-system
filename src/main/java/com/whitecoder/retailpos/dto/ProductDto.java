package com.whitecoder.retailpos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductDto(
        Long productId,
        Long categoryId,
        String categoryName,
        String productName,
        String description,
        BigDecimal price,
        int stockQuantity,
        String barcode,
        String imageUrl,
        boolean status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
