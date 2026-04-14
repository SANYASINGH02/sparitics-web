package com.sparitics.dto;

public class CountingResponse {

    private String message;
    private boolean duplicate;
    private Integer existingQuantity;

    public CountingResponse(String message, boolean duplicate, Integer existingQuantity) {
        this.message = message;
        this.duplicate = duplicate;
        this.existingQuantity = existingQuantity;
    }

    public String getMessage() {
        return message;
    }

    public boolean isDuplicate() {
        return duplicate;
    }

    public Integer getExistingQuantity() {
        return existingQuantity;
    }
}
