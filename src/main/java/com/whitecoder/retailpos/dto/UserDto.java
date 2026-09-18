package com.whitecoder.retailpos.dto;

public record UserDto(
        Long userId,
        String username,
        String fullName,
        String email,
        String role
) {
}
