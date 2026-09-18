package com.whitecoder.retailpos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record OrderItemRequest(
        @NotNull Long productId,
        @NotNull @Min(1) Integer quantity,
        BigDecimal discount
) {
}
