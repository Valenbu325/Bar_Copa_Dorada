package com.copadorada.backend.controller;

import com.copadorada.backend.dto.CreateUserRequest;
import com.copadorada.backend.dto.UserDto;
import com.copadorada.backend.service.UserService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UsersController {

    private final UserService userService;

    public UsersController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserDto> getUsers() {
        return userService.getUsers();
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> createUser(@RequestBody CreateUserRequest request) {
        long id = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }
}

