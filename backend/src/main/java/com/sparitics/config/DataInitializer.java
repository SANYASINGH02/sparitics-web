package com.sparitics.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.sparitics.entity.User;
import com.sparitics.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        List<User> existingAdmin = userRepository.findByUserIdAndUserType("admin", "ADMIN");
        if (existingAdmin.isEmpty()) {
            User admin = new User();
            admin.setUserId("admin");
            admin.setFullName("Administrator");
            admin.setPhoneNumber("9999999999");
            admin.setPassword("admin123");
            admin.setUserType("ADMIN");
            userRepository.save(admin);
            log.info("Default admin user created (userID: admin, password: admin123)");
        } else {
            log.info("Default admin user already exists, skipping seed.");
        }
    }
}
