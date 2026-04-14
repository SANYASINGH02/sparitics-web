package com.sparitics.dto;

public class CountingRequest {

    private String partNumber;
    private Integer quantity;
    private String location;
    private String countingMode;
    private String remark;

    public String getPartNumber() {
        return partNumber;
    }

    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCountingMode() {
        return countingMode;
    }

    public void setCountingMode(String countingMode) {
        this.countingMode = countingMode;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
