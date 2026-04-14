package com.sparitics.controller;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sparitics.dto.BarcodeResult;
import com.sparitics.dto.CountingRequest;
import com.sparitics.dto.CountingResponse;
import com.sparitics.dto.MultiLocationUpdateItem;
import com.sparitics.dto.UpdateFormRequest;
import com.sparitics.entity.CountingRecord;
import com.sparitics.entity.PartMaster;
import com.sparitics.repository.CountingRecordRepository;
import com.sparitics.repository.PartMasterRepository;
import com.sparitics.service.CountingService;
import com.sparitics.util.BarcodeParser;

@RestController
@RequestMapping("/api")
public class CountingController {

    private final CountingRecordRepository countingRecordRepository;
    private final PartMasterRepository partMasterRepository;
    private final CountingService countingService;

    public CountingController(CountingRecordRepository countingRecordRepository,
                              PartMasterRepository partMasterRepository,
                              CountingService countingService) {
        this.countingRecordRepository = countingRecordRepository;
        this.partMasterRepository = partMasterRepository;
        this.countingService = countingService;
    }

    // --- 6.1: Counting Dashboard Endpoints ---

    @GetMapping("/counting")
    public ResponseEntity<List<CountingRecord>> getAllCounting() {
        return ResponseEntity.ok(countingRecordRepository.findAll());
    }

    @GetMapping("/counting/search")
    public ResponseEntity<List<CountingRecord>> searchCounting(
            @RequestParam("partNumber") String partNumber) {
        return ResponseEntity.ok(countingRecordRepository.findByPartnumber(partNumber));
    }

    @GetMapping("/parts/autocomplete")
    public ResponseEntity<?> autocomplete(@RequestParam("query") String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        List<String> partNumbers = partMasterRepository
                .findTop10ByPartnumberContaining(query.trim())
                .stream()
                .map(PartMaster::getPartnumber)
                .collect(Collectors.toList());
        return ResponseEntity.ok(partNumbers);
    }

    // --- 6.2: Counting Submission ---

    @PostMapping("/counting")
    public ResponseEntity<?> submitCounting(@RequestBody CountingRequest request,
                                            Authentication authentication) {
        List<String> missing = new ArrayList<>();
        if (isBlank(request.getPartNumber())) missing.add("partNumber");
        if (request.getQuantity() == null) missing.add("quantity");
        if (isBlank(request.getLocation())) missing.add("location");
        if (isBlank(request.getCountingMode())) missing.add("countingMode");

        if (!missing.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("missingFields", missing));
        }

        String userName = (String) authentication.getPrincipal();
        CountingResponse response = countingService.submitCounting(request, userName);
        return ResponseEntity.ok(response);
    }

    // --- 6.3: Barcode Parser ---

    @PostMapping("/barcode/parse")
    public ResponseEntity<?> parseBarcode(@RequestBody Map<String, String> body) {
        String barcode = body.get("barcode");
        BarcodeResult result = BarcodeParser.parse(barcode);

        if (result.hasError()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", result.getError()));
        }

        return ResponseEntity.ok(Map.of(
                "partNumber", result.getPartNumber(),
                "quantity", result.getQuantity()));
    }

    // --- 6.4: Counting Export ---

    @GetMapping("/counting/export")
    public ResponseEntity<byte[]> exportCounting(Authentication authentication) throws Exception {
        String userName = (String) authentication.getPrincipal();
        String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "CountingExport_" + userName + "__" + timestamp + ".xlsx";

        List<CountingRecord> records = countingRecordRepository.findAll();

        byte[] excelBytes = generateExcel(records);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    // --- 6.5: Counting Record Locations ---

    @GetMapping("/counting/locations")
    public ResponseEntity<?> getLocations(@RequestParam("partNumber") String partNumber) {
        List<CountingRecord> records = countingRecordRepository.findByPartnumber(partNumber);
        List<Map<String, Object>> locations = records.stream()
                .map(r -> Map.<String, Object>of(
                        "id", r.getId(),
                        "location", r.getLocation(),
                        "finalQty", r.getFinalQty()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(locations);
    }

    // --- 7.1: Multi-Location Management ---

    @GetMapping("/counting/multi-location")
    public ResponseEntity<?> getMultiLocation(@RequestParam("partNumber") String partNumber) {
        List<CountingRecord> records = countingRecordRepository.findByPartnumber(partNumber);
        List<Map<String, Object>> result = records.stream()
                .map(r -> Map.<String, Object>of(
                        "id", r.getId(),
                        "partNumber", r.getPartnumber(),
                        "location", r.getLocation(),
                        "finalQty", r.getFinalQty()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/counting/multi-location")
    public ResponseEntity<?> updateMultiLocation(
            @RequestBody List<MultiLocationUpdateItem> updates) {
        if (updates == null || updates.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No updates provided"));
        }
        try {
            countingService.updateMultiLocationQuantities(updates);
            return ResponseEntity.ok(Map.of("message", "All quantities updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Transaction failed: " + e.getMessage()));
        }
    }

    // --- 7.2: Update Form ---

    @PutMapping("/counting/{id}")
    public ResponseEntity<?> updateCountingRecord(
            @PathVariable("id") Integer id,
            @RequestBody UpdateFormRequest request,
            Authentication authentication) {
        List<String> missing = new ArrayList<>();
        if (isBlank(request.getPartNumber())) missing.add("partNumber");
        if (isBlank(request.getLocation())) missing.add("location");
        if (request.getQuantity() == null || request.getQuantity() < 0) missing.add("quantity");

        if (!missing.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("invalidFields", missing));
        }

        String userName = (String) authentication.getPrincipal();
        try {
            CountingRecord updated = countingService.updateCountingRecord(id, request, userName);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // --- Helpers ---

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private byte[] generateExcel(List<CountingRecord> records) throws Exception {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Counting Data");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {
                    "Id", "DealerID", "UserName", "Partnumber", "Location",
                    "Partdesc", "PartPrice", "Count", "Category", "Remark",
                    "MOQ", "NotInPartMaster", "DateAdded", "DateModi",
                    "Recheck_User", "Recheck_Count", "Recheck_Remark",
                    "Recheck_DateAdded", "TransactedPart", "RecheckFlag",
                    "Final_Qty", "Countingby", "ModiCount"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            for (int i = 0; i < records.size(); i++) {
                CountingRecord r = records.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(r.getId() != null ? r.getId() : 0);
                row.createCell(1).setCellValue(r.getDealerId() != null ? r.getDealerId() : 0);
                row.createCell(2).setCellValue(safe(r.getUserName()));
                row.createCell(3).setCellValue(safe(r.getPartnumber()));
                row.createCell(4).setCellValue(safe(r.getLocation()));
                row.createCell(5).setCellValue(safe(r.getPartdesc()));
                row.createCell(6).setCellValue(
                        r.getPartPrice() != null ? r.getPartPrice().doubleValue() : 0);
                row.createCell(7).setCellValue(r.getCount() != null ? r.getCount() : 0);
                row.createCell(8).setCellValue(safe(r.getCategory()));
                row.createCell(9).setCellValue(safe(r.getRemark()));
                row.createCell(10).setCellValue(r.getMoq() != null ? r.getMoq() : 0);
                row.createCell(11).setCellValue(safe(r.getNotInPartMaster()));
                row.createCell(12).setCellValue(
                        r.getDateadded() != null ? r.getDateadded().format(dtf) : "");
                row.createCell(13).setCellValue(
                        r.getDatemodi() != null ? r.getDatemodi().format(dtf) : "");
                row.createCell(14).setCellValue(safe(r.getRecheckUser()));
                row.createCell(15).setCellValue(
                        r.getRecheckCount() != null ? r.getRecheckCount() : 0);
                row.createCell(16).setCellValue(safe(r.getRecheckRemark()));
                row.createCell(17).setCellValue(
                        r.getRecheckDateadded() != null ? r.getRecheckDateadded().format(dtf) : "");
                row.createCell(18).setCellValue(safe(r.getTransactedPart()));
                row.createCell(19).setCellValue(safe(r.getRecheckFlag()));
                row.createCell(20).setCellValue(r.getFinalQty() != null ? r.getFinalQty() : 0);
                row.createCell(21).setCellValue(safe(r.getCountingby()));
                row.createCell(22).setCellValue(r.getModicount() != null ? r.getModicount() : 0);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private String safe(String value) {
        return value != null ? value : "";
    }
}
