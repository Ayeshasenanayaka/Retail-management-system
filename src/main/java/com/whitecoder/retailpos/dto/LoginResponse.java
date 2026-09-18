package com.whitecoder.retailpos.dto;

public record LoginResponse(
        String token,
        UserDto user
) {
}
