package com.whitecoder.retailpos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;

public record OrderCreateRequest(
        Long customerId,
        @NotEmpty List<@Valid OrderItemRequest> items,
        BigDecimal discount,
        String paymentMethod,
        String transactionId,
        BigDecimal tenderedAmount,
        String cardHolderName,
        String cardLastFour,
        String cardReferenceNo,
        String notes
) {
}
