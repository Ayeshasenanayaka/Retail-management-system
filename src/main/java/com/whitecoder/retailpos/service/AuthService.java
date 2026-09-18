package com.whitecoder.retailpos.service;

import com.whitecoder.retailpos.dto.LoginRequest;
import com.whitecoder.retailpos.dto.LoginResponse;
import com.whitecoder.retailpos.exception.ApiException;
import com.whitecoder.retailpos.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MapperService mapper;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, MapperService mapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mapper = mapper;
    }

    public LoginResponse login(LoginRequest request) {
        var user = userRepository.findByUsername(request.username()).orElseThrow(() -> new ApiException("Invalid username or password", HttpStatus.UNAUTHORIZED));
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException("Invalid username or password", HttpStatus.UNAUTHORIZED);
        }
        return new LoginResponse(jwtService.generateToken(user), mapper.user(user));
    }
}
