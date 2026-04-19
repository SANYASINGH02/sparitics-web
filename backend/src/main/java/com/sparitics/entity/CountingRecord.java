package com.sparitics.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tblCounting")
public class CountingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "DealerID", nullable = false)
    private Integer dealerId;

    @Column(name = "UserName", nullable = false, length = 200)
    private String userName;

    @Column(name = "Partnumber", nullable = false, length = 200)
    private String partnumber;

    @Column(name = "Location", nullable = false, length = 200)
    private String location;

    @Column(name = "Partdesc", nullable = false, length = 200)
    private String partdesc;

    @Column(name = "PartPrice", nullable = false, precision = 18, scale = 4)
    private BigDecimal partPrice;

    @Column(name = "count", nullable = false)
    private Integer count;

    @Column(name = "Category", nullable = false, length = 200)
    private String category;

    @Column(name = "Remark", nullable = false, length = 200)
    private String remark;

    @Column(name = "MOQ", nullable = false)
    private Integer moq;

    @Column(name = "NotInPartMaster", nullable = false, length = 200)
    private String notInPartMaster;

    @Column(name = "Dateadded", nullable = false)
    private LocalDateTime dateadded;

    @Column(name = "Datemodi", nullable = false)
    private LocalDateTime datemodi;

    @Column(name = "Recheck_User", nullable = false, length = 200)
    private String recheckUser;

    @Column(name = "Recheck_Count", nullable = false)
    private Integer recheckCount;

    @Column(name = "Recheck_Remark", nullable = false, length = 200)
    private String recheckRemark;

    @Column(name = "Recheck_Dateadded", nullable = false)
    private LocalDateTime recheckDateadded;

    @Column(name = "TransactedPart", nullable = false, length = 20)
    private String transactedPart;

    @Column(name = "RecheckFlag", nullable = false, length = 20)
    private String recheckFlag;

    @Column(name = "Final_Qty", nullable = false)
    private Integer finalQty;

    @Column(name = "Countingby", nullable = false, length = 100)
    private String countingby;

    @Column(name = "modicount", nullable = false)
    private Integer modicount;

    public CountingRecord() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getDealerId() {
        return dealerId;
    }

    public void setDealerId(Integer dealerId) {
        this.dealerId = dealerId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPartnumber() {
        return partnumber;
    }

    public void setPartnumber(String partnumber) {
        this.partnumber = partnumber;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPartdesc() {
        return partdesc;
    }

    public void setPartdesc(String partdesc) {
        this.partdesc = partdesc;
    }

    public BigDecimal getPartPrice() {
        return partPrice;
    }

    public void setPartPrice(BigDecimal partPrice) {
        this.partPrice = partPrice;
    }

    public Integer getCount() {
        return count;
    }

    public void setCount(Integer count) {
        this.count = count;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public String getNotInPartMaster() {
        return notInPartMaster;
    }

    public void setNotInPartMaster(String notInPartMaster) {
        this.notInPartMaster = notInPartMaster;
    }

    public LocalDateTime getDateadded() {
        return dateadded;
    }

    public void setDateadded(LocalDateTime dateadded) {
        this.dateadded = dateadded;
    }

    public LocalDateTime getDatemodi() {
        return datemodi;
    }

    public void setDatemodi(LocalDateTime datemodi) {
        this.datemodi = datemodi;
    }

    public String getRecheckUser() {
        return recheckUser;
    }

    public void setRecheckUser(String recheckUser) {
        this.recheckUser = recheckUser;
    }

    public Integer getRecheckCount() {
        return recheckCount;
    }

    public void setRecheckCount(Integer recheckCount) {
        this.recheckCount = recheckCount;
    }

    public String getRecheckRemark() {
        return recheckRemark;
    }

    public void setRecheckRemark(String recheckRemark) {
        this.recheckRemark = recheckRemark;
    }

    public LocalDateTime getRecheckDateadded() {
        return recheckDateadded;
    }

    public void setRecheckDateadded(LocalDateTime recheckDateadded) {
        this.recheckDateadded = recheckDateadded;
    }

    public String getTransactedPart() {
        return transactedPart;
    }

    public void setTransactedPart(String transactedPart) {
        this.transactedPart = transactedPart;
    }

    public String getRecheckFlag() {
        return recheckFlag;
    }

    public void setRecheckFlag(String recheckFlag) {
        this.recheckFlag = recheckFlag;
    }

    public Integer getFinalQty() {
        return finalQty;
    }

    public void setFinalQty(Integer finalQty) {
        this.finalQty = finalQty;
    }

    public String getCountingby() {
        return countingby;
    }

    public void setCountingby(String countingby) {
        this.countingby = countingby;
    }

    public Integer getModicount() {
        return modicount;
    }

    public void setModicount(Integer modicount) {
        this.modicount = modicount;
    }
}
