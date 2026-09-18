package com.whitecoder.retailpos.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank String categoryName,
        String description,
        Boolean status
) {
}
