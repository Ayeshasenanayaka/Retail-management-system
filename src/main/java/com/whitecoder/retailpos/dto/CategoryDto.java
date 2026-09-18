package com.whitecoder.retailpos.dto;

import java.time.LocalDateTime;

public record CategoryDto(
        Long categoryId,
        String categoryName,
        String description,
        boolean status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
