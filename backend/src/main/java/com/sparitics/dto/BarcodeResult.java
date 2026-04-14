package com.sparitics.dto;

public class BarcodeResult {

    private String partNumber;
    private int quantity;
    private String error;

    public BarcodeResult(String partNumber, int quantity) {
        this.partNumber = partNumber;
        this.quantity = quantity;
    }

    public BarcodeResult(String error) {
        this.error = error;
    }

    public String getPartNumber() {
        return partNumber;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getError() {
        return error;
    }

    public boolean hasError() {
        return error != null;
    }
}
