package com.whitecoder.retailpos.dto;

import java.math.BigDecimal;

public record TopProductDto(
        String productName,
        long quantity,
        BigDecimal total
) {
}
