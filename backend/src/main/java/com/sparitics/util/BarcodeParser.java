package com.sparitics.util;

import com.sparitics.dto.BarcodeResult;

public final class BarcodeParser {

    private BarcodeParser() {
    }

    /**
     * Splits a raw barcode string into part number and quantity.
     * The trailing numeric portion is the quantity; the leading portion is the part number.
     * If no trailing digits exist, quantity defaults to 1.
     * If the input is empty/blank, returns an error result.
     */
    public static BarcodeResult parse(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            return new BarcodeResult("Barcode string is empty or blank");
        }

        String trimmed = barcode.trim();

        // Find where trailing digits start
        int splitIndex = trimmed.length();
        while (splitIndex > 0 && Character.isDigit(trimmed.charAt(splitIndex - 1))) {
            splitIndex--;
        }

        if (splitIndex == 0) {
            // Entire string is numeric — treat as part number with qty 1
            return new BarcodeResult(trimmed, 1);
        }

        if (splitIndex == trimmed.length()) {
            // No trailing digits — part number is the whole string, qty = 1
            return new BarcodeResult(trimmed, 1);
        }

        String partNumber = trimmed.substring(0, splitIndex);
        int quantity = Integer.parseInt(trimmed.substring(splitIndex));

        return new BarcodeResult(partNumber, quantity);
    }
}
