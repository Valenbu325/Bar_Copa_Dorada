package com.copadorada.backend.service;

import com.copadorada.backend.dto.CreateUserRequest;
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
            throw new IllegalArgumentException("email is required");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("password is required");
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
}

