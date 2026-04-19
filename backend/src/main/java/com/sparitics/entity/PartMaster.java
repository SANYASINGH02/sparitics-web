package com.sparitics.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "PartMaster")
public class PartMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "Partnumber", nullable = false, length = 200, unique = true)
    private String partnumber;

    @Column(name = "Partnumber1", nullable = false, length = 200)
    private String partnumber1;

    @Column(name = "PartDescription", nullable = false, length = 200)
    private String partDescription;

    @Column(name = "category", nullable = false, length = 200)
    private String category;

    @Column(name = "Landedcost", nullable = false, precision = 18, scale = 4)
    private BigDecimal landedcost;

    @Column(name = "MRP", precision = 18, scale = 3)
    private BigDecimal mrp;

    @Column(name = "Remark", length = 200)
    private String remark;

    @Column(name = "MOQ")
    private Integer moq;

    public PartMaster() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getPartnumber() {
        return partnumber;
    }

    public void setPartnumber(String partnumber) {
        this.partnumber = partnumber;
    }

    public String getPartnumber1() {
        return partnumber1;
    }

    public void setPartnumber1(String partnumber1) {
        this.partnumber1 = partnumber1;
    }

    public String getPartDescription() {
        return partDescription;
    }

    public void setPartDescription(String partDescription) {
        this.partDescription = partDescription;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getLandedcost() {
        return landedcost;
    }

    public void setLandedcost(BigDecimal landedcost) {
        this.landedcost = landedcost;
    }

    public BigDecimal getMrp() {
        return mrp;
    }

    public void setMrp(BigDecimal mrp) {
        this.mrp = mrp;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public Integer getMoq() {
        return moq;
    }

    public void setMoq(Integer moq) {
        this.moq = moq;
    }
}
