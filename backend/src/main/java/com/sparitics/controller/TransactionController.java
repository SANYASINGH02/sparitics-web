package com.sparitics.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sparitics.entity.TblTruncate;
import com.sparitics.repository.TblTruncateRepository;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TblTruncateRepository tblTruncateRepository;

    public TransactionController(TblTruncateRepository tblTruncateRepository) {
        this.tblTruncateRepository = tblTruncateRepository;
    }

    @GetMapping
    public ResponseEntity<List<TblTruncate>> getAllTransactions() {
        return ResponseEntity.ok(tblTruncateRepository.findAll());
    }

    @DeleteMapping("/truncate")
    public ResponseEntity<?> truncateTransactions() {
        tblTruncateRepository.truncateAll();
        return ResponseEntity.ok(Map.of("message", "tblTruncate table truncated successfully"));
    }
}
