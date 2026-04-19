package com.sparitics.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sparitics.dto.UserRequest;
import com.sparitics.entity.User;
import com.sparitics.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
        List<String> missingFields = new ArrayList<>();
        if (isBlank(request.getUserID())) {
            missingFields.add("userID");
        }
        if (isBlank(request.getFullName())) {
            missingFields.add("fullName");
        }
        if (isBlank(request.getPassword())) {
            missingFields.add("password");
        }
        if (isBlank(request.getUserType())) {
            missingFields.add("userType");
        }

        if (!missingFields.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("missingFields", missingFields));
        }

        // Check duplicate UserID + UserType
        List<User> existing = userRepository.findByUserIdAndUserType(
                request.getUserID().trim(), request.getUserType().trim());
        if (!existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message",
                            "User with UserID '" + request.getUserID().trim()
                                    + "' and UserType '" + request.getUserType().trim() + "' already exists"));
        }

        User user = new User();
        user.setUserId(request.getUserID().trim());
        user.setFullName(request.getFullName().trim());
        user.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null);
        user.setPassword(request.getPassword().trim());
        user.setUserType(request.getUserType().trim());

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getAllUsers() {
        List<Map<String, String>> users = userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{userID}")
    public ResponseEntity<?> updateUser(@PathVariable String userID, @RequestBody UserRequest request) {
        List<User> users = userRepository.findByUserId(userID);
        if (users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found with UserID: " + userID));
        }

        User user = users.get(0);
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(request.getPassword().trim());
        }
        if (request.getUserType() != null && !request.getUserType().trim().isEmpty()) {
            user.setUserType(request.getUserType().trim());
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{userID}")
    public ResponseEntity<?> deleteUser(@PathVariable String userID) {
        List<User> users = userRepository.findByUserId(userID);
        if (users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found with UserID: " + userID));
        }

        userRepository.deleteAll(users);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private Map<String, String> toResponse(User user) {
        return Map.of(
                "userID", user.getUserId() != null ? user.getUserId().trim() : "",
                "fullName", user.getFullName() != null ? user.getFullName().trim() : "",
                "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber().trim() : "",
                "password", user.getPassword() != null ? user.getPassword().trim() : "",
                "userType", user.getUserType() != null ? user.getUserType().trim() : "");
    }
}
