package com.sparitics.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sparitics.entity.PartMaster;
import com.sparitics.repository.PartMasterRepository;
import com.sparitics.service.PartImportService;

@RestController
@RequestMapping("/api/parts")
public class PartController {

    private final PartImportService partImportService;
    private final PartMasterRepository partMasterRepository;

    public PartController(PartImportService partImportService,
                          PartMasterRepository partMasterRepository) {
        this.partImportService = partImportService;
        this.partMasterRepository = partMasterRepository;
    }

    @PostMapping("/import")
    public ResponseEntity<?> importParts(@RequestParam("file") MultipartFile file) {
        try {
            return partImportService.importExcel(file.getInputStream());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error processing file: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<PartMaster>> getAllParts() {
        return ResponseEntity.ok(partMasterRepository.findAll());
    }

    @GetMapping("/lookup")
    public ResponseEntity<?> lookupPart(@RequestParam("partNumber") String partNumber) {
        return partMasterRepository.findByPartnumber(partNumber.trim())
                .map(part -> ResponseEntity.ok(Map.of(
                        "partNumber", part.getPartnumber(),
                        "partDescription", part.getPartDescription(),
                        "category", part.getCategory(),
                        "landedCost", part.getLandedcost(),
                        "moq", part.getMoq() != null ? part.getMoq() : 0)))
                .orElse(ResponseEntity.ok(Map.of()));
    }

    @DeleteMapping("/truncate")
    public ResponseEntity<?> truncateParts() {
        partMasterRepository.truncateAll();
        return ResponseEntity.ok(Map.of("message", "PartMaster table truncated successfully"));
    }
}
