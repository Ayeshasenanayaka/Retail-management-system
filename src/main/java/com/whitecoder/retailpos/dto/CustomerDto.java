package com.whitecoder.retailpos.dto;

import java.time.LocalDateTime;

public record CustomerDto(
        Long customerId,
        String name,
        String phone,
        String email,
        String address,
        LocalDateTime createdAt
) {
}
