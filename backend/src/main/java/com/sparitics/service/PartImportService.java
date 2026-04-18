package com.sparitics.service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.sparitics.entity.PartMaster;
import com.sparitics.repository.PartMasterRepository;

@Service
public class PartImportService {

    private final PartMasterRepository partMasterRepository;

    public PartImportService(PartMasterRepository partMasterRepository) {
        this.partMasterRepository = partMasterRepository;
    }

    public ResponseEntity<?> importExcel(InputStream inputStream) throws Exception {
        List<PartMaster> parts = new ArrayList<>();
        List<String> allPartNumbers = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();

            if (lastRow < 1) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "No records found in Excel"));
            }

            // Build column index map from header row
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "No records found in Excel"));
            }

            Map<String, Integer> colMap = new java.util.HashMap<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell != null) {
                    String header = getCellStringValue(cell).toLowerCase().replaceAll("[^a-z0-9]", "");
                    colMap.put(header, c);
                }
            }

            // Find column indices (case-insensitive, stripped of special chars)
            int colPartNumber = findColumn(colMap, "partnumber");
            int colPartNumber1 = findColumn(colMap, "partnumber1");
            int colPartDesc = findColumn(colMap, "partdescription");
            int colCategory = findColumn(colMap, "category");
            int colLandedCost = findColumn(colMap, "landedcost");
            int colMRP = findColumn(colMap, "mrp");
            int colRemark = findColumn(colMap, "remark");
            int colMOQ = findColumn(colMap, "moq");

            if (colPartNumber < 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Excel file must have a 'Partnumber' column. Found headers: " + colMap.keySet()));
            }

            // Parse data rows (row 0 is header)
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }

                String partnumber = getCellStringValue(row.getCell(colPartNumber));
                if (partnumber.isEmpty()) {
                    continue;
                }

                PartMaster part = new PartMaster();
                part.setPartnumber(partnumber);
                part.setPartnumber1(colPartNumber1 >= 0 ? getCellStringValue(row.getCell(colPartNumber1)) : "");
                part.setPartDescription(colPartDesc >= 0 ? getCellStringValue(row.getCell(colPartDesc)) : "");
                part.setCategory(colCategory >= 0 ? getCellStringValue(row.getCell(colCategory)) : "");
                part.setLandedcost(colLandedCost >= 0 ? getCellBigDecimalValue(row.getCell(colLandedCost)) : BigDecimal.ZERO);
                part.setMrp(colMRP >= 0 ? getCellBigDecimalValue(row.getCell(colMRP)) : null);
                part.setRemark(colRemark >= 0 ? getCellStringValue(row.getCell(colRemark)) : "");
                part.setMoq(colMOQ >= 0 ? getCellIntegerValue(row.getCell(colMOQ)) : null);

                parts.add(part);
                allPartNumbers.add(partnumber);
            }
        }

        if (parts.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No records found in Excel"));
        }

        // Detect duplicates within the file
        Set<String> seen = new HashSet<>();
        Set<String> duplicates = new HashSet<>();
        for (String pn : allPartNumbers) {
            if (!seen.add(pn)) {
                duplicates.add(pn);
            }
        }
        if (!duplicates.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Duplicate Partnumbers found in Excel",
                            "duplicates", new ArrayList<>(duplicates)));
        }

        // Check against existing records in DB — single batch query instead of N queries
        List<String> existingInDb = partMasterRepository.findExistingPartnumbers(allPartNumbers);
        if (!existingInDb.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "These Partnumbers already exist in the database",
                            "existing", existingInDb));
        }

        // Bulk insert in batches of 500
        int batchSize = 500;
        for (int i = 0; i < parts.size(); i += batchSize) {
            int end = Math.min(i + batchSize, parts.size());
            partMasterRepository.saveAll(parts.subList(i, end));
            partMasterRepository.flush();
        }

        return ResponseEntity.ok(Map.of("message", "Import successful",
                "count", parts.size()));
    }

    private int findColumn(Map<String, Integer> colMap, String name) {
        Integer idx = colMap.get(name);
        if (idx != null) return idx;
        // Try partial match
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().contains(name)) return entry.getValue();
        }
        return -1;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue().trim();
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            double val = cell.getNumericCellValue();
            if (val == Math.floor(val) && !Double.isInfinite(val)) {
                return String.valueOf((long) val);
            }
            return String.valueOf(val);
        }
        if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        }
        return "";
    }

    private BigDecimal getCellBigDecimalValue(Cell cell) {
        if (cell == null) {
            return BigDecimal.ZERO;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }
        if (cell.getCellType() == CellType.STRING) {
            String val = cell.getStringCellValue().trim();
            if (val.isEmpty()) {
                return BigDecimal.ZERO;
            }
            return new BigDecimal(val);
        }
        return BigDecimal.ZERO;
    }

    private Integer getCellIntegerValue(Cell cell) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        }
        if (cell.getCellType() == CellType.STRING) {
            String val = cell.getStringCellValue().trim();
            if (val.isEmpty()) {
                return null;
            }
            return Integer.parseInt(val);
        }
        return null;
    }
}
