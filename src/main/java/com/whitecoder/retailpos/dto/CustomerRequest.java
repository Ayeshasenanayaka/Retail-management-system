package com.whitecoder.retailpos.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerRequest(
        @NotBlank String name,
        String phone,
        String email,
        String address
) {
}
