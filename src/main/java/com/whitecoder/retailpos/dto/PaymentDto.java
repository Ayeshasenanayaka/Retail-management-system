package com.whitecoder.retailpos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentDto(
        Long paymentId,
        String paymentMethod,
        BigDecimal amount,
        BigDecimal tenderedAmount,
        BigDecimal balanceAmount,
        String transactionId,
        String cardHolderName,
        String cardLastFour,
        String cardReferenceNo,
        LocalDateTime paymentDate,
        String status
) {
}
