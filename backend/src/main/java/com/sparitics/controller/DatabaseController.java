package com.sparitics.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sparitics.repository.CountingRecordRepository;
import com.sparitics.repository.PartMasterRepository;

@RestController
@RequestMapping("/api/database")
public class DatabaseController {

    private final PartMasterRepository partMasterRepository;
    private final CountingRecordRepository countingRecordRepository;

    public DatabaseController(PartMasterRepository partMasterRepository,
                              CountingRecordRepository countingRecordRepository) {
        this.partMasterRepository = partMasterRepository;
        this.countingRecordRepository = countingRecordRepository;
    }

    @DeleteMapping("/clean")
    public ResponseEntity<?> cleanDatabase() {
        try {
            partMasterRepository.truncateAll();
            countingRecordRepository.truncateAll();
            return ResponseEntity.ok(Map.of("message", "Database cleaned successfully. PartMaster and Counting tables truncated."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to clean the database: " + e.getMessage()));
        }
    }
}
