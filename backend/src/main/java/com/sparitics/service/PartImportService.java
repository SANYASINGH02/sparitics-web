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

            // Parse data rows (row 0 is header)
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }

                String partnumber = getCellStringValue(row.getCell(0));
                if (partnumber.isEmpty()) {
                    continue;
                }

                PartMaster part = new PartMaster();
                part.setPartnumber(partnumber);
                part.setPartnumber1(getCellStringValue(row.getCell(1)));
                part.setPartDescription(getCellStringValue(row.getCell(2)));
                part.setCategory(getCellStringValue(row.getCell(3)));
                part.setLandedcost(getCellBigDecimalValue(row.getCell(4)));
                part.setMrp(getCellBigDecimalValue(row.getCell(5)));
                part.setRemark(getCellStringValue(row.getCell(6)));
                part.setMoq(getCellIntegerValue(row.getCell(7)));

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

        // Check against existing records in DB
        List<String> existingInDb = new ArrayList<>();
        for (String pn : allPartNumbers) {
            if (partMasterRepository.existsByPartnumber(pn)) {
                existingInDb.add(pn);
            }
        }
        if (!existingInDb.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "These Partnumbers already exist in the database",
                            "existing", existingInDb));
        }

        // Bulk insert
        partMasterRepository.saveAll(parts);

        return ResponseEntity.ok(Map.of("message", "Import successful",
                "count", parts.size()));
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
