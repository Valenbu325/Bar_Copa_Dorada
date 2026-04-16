package com.copadorada.backend.service;

import com.copadorada.backend.dto.LoginResponse;
import com.copadorada.backend.repository.AuthRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthRepository authRepository;

    public AuthService(AuthRepository authRepository) {
        this.authRepository = authRepository;
    }

    public Optional<LoginResponse> login(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return Optional.empty();
        }
        return authRepository.login(email.trim(), password.trim());
    }
}

