package com.copadorada.backend.service;

import com.copadorada.backend.dto.CreateUserRequest;
import com.copadorada.backend.dto.UpdateUserRequest;
import com.copadorada.backend.dto.UserDto;
import com.copadorada.backend.repository.AuditRepository;
import com.copadorada.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuditRepository auditRepository;

    public UserService(UserRepository userRepository, AuditRepository auditRepository) {
        this.userRepository = userRepository;
        this.auditRepository = auditRepository;
    }

    public List<UserDto> getUsers() {
        return userRepository.findAll();
    }

    public long createUser(CreateUserRequest request) {
        if (request.fullName() == null || request.fullName().isBlank()) {
            throw new IllegalArgumentException("fullName is required");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("El correo es obligatorio.");
        }
        if (!request.email().trim().toLowerCase().endsWith("@copadorada.com")) {
            throw new IllegalArgumentException("El correo debe tener el dominio @copadorada.com");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria.");
        }
        if (request.password().trim().length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener mínimo 8 caracteres.");
        }
        if (!request.password().trim().matches(".*[0-9].*")) {
            throw new IllegalArgumentException("La contraseña debe contener al menos un número.");
        }
        if (request.roleCode() == null || request.roleCode().isBlank()) {
            throw new IllegalArgumentException("roleCode is required");
        }
        if (request.branchId() == null) {
            throw new IllegalArgumentException("branchId is required");
        }

        long id = userRepository.create(new CreateUserRequest(
                request.fullName().trim(),
                request.email().trim().toLowerCase(),
                request.password().trim(),
                request.roleCode().trim().toUpperCase(),
                request.branchId()));
        auditRepository.log(null, "CREATE_USER", "users", id, "User created from UI");
        return id;
    }

    public void toggleUserActive(Long userId) {
        userRepository.toggleActive(userId);
        auditRepository.log(null, "TOGGLE_USER_ACTIVE", "users", userId, "Active status toggled from UI");
    }

    public void updateUser(Long userId, UpdateUserRequest request) {
        if (request.fullName() == null || request.fullName().isBlank())
            throw new IllegalArgumentException("fullName is required");
        if (request.roleCode() == null || request.roleCode().isBlank())
            throw new IllegalArgumentException("roleCode is required");
        if (request.branchId() == null)
            throw new IllegalArgumentException("branchId is required");
        userRepository.update(userId, new UpdateUserRequest(
                request.fullName().trim(),
                request.roleCode().trim().toUpperCase(),
                request.branchId()));
        auditRepository.log(null, "UPDATE_USER", "users", userId, "Updated from UI");
    }
}

