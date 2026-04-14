package com.sparitics.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sparitics.dto.LoginRequest;
import com.sparitics.dto.LoginResponse;
import com.sparitics.entity.User;
import com.sparitics.repository.UserRepository;
import com.sparitics.security.JwtService;
import com.sparitics.util.PasscodeUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 1. Validate all four fields non-empty
        List<String> missingFields = new ArrayList<>();
        if (isBlank(request.getUserID())) {
            missingFields.add("userID");
        }
        if (isBlank(request.getPassword())) {
            missingFields.add("password");
        }
        if (isBlank(request.getUserType())) {
            missingFields.add("userType");
        }
        if (isBlank(request.getPasscode())) {
            missingFields.add("passcode");
        }

        if (!missingFields.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("missingFields", missingFields));
        }

        // 2. Validate passcode
        int expectedPasscode = PasscodeUtil.generateDailyPasscode();
        try {
            int providedPasscode = Integer.parseInt(request.getPasscode().trim());
            if (providedPasscode != expectedPasscode) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid Daily Passcode"));
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid Daily Passcode"));
        }

        // 3. Query user credentials
        Optional<User> user = userRepository.findByUserIdAndPasswordAndUserType(
                request.getUserID().trim(),
                request.getPassword().trim(),
                request.getUserType().trim());

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid Login Credentials"));
        }

        // 4. Generate JWT and return
        String token = jwtService.generateToken(
                user.get().getUserId().trim(),
                user.get().getUserType().trim());

        LoginResponse response = new LoginResponse(
                token,
                user.get().getUserId().trim(),
                user.get().getUserType().trim());

        return ResponseEntity.ok(response);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
