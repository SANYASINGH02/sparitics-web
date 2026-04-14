package com.sparitics.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sparitics.dto.CountingRequest;
import com.sparitics.dto.CountingResponse;
import com.sparitics.dto.MultiLocationUpdateItem;
import com.sparitics.dto.UpdateFormRequest;
import com.sparitics.entity.CountingRecord;
import com.sparitics.entity.PartMaster;
import com.sparitics.repository.CountingRecordRepository;
import com.sparitics.repository.PartMasterRepository;

@Service
public class CountingService {

    private final CountingRecordRepository countingRecordRepository;
    private final PartMasterRepository partMasterRepository;

    public CountingService(CountingRecordRepository countingRecordRepository,
                           PartMasterRepository partMasterRepository) {
        this.countingRecordRepository = countingRecordRepository;
        this.partMasterRepository = partMasterRepository;
    }

    public CountingResponse submitCounting(CountingRequest request, String userName) {
        String partNumber = request.getPartNumber();
        String location = request.getLocation();
        int quantity = request.getQuantity();
        String mode = request.getCountingMode();
        LocalDateTime now = LocalDateTime.now();

        Optional<CountingRecord> existing =
                countingRecordRepository.findByPartnumberAndLocation(partNumber, location);

        if (existing.isPresent()) {
            return updateExistingRecord(existing.get(), quantity, mode, userName, now);
        } else {
            return insertNewRecord(partNumber, location, quantity, mode, userName, now);
        }
    }

    private CountingResponse updateExistingRecord(CountingRecord record, int quantity,
                                                   String mode, String userName,
                                                   LocalDateTime now) {
        int previousQty = record.getFinalQty();
        record.setFinalQty(quantity);
        record.setDatemodi(now);
        record.setRecheckCount(quantity);
        record.setRecheckDateadded(now);
        record.setRecheckFlag("Y");
        record.setModicount(record.getModicount() + 1);
        record.setRecheckRemark(record.getRemark());
        record.setRecheckUser(userName);
        record.setCountingby(mode);

        countingRecordRepository.save(record);

        return new CountingResponse("Record updated", true, previousQty);
    }

    private CountingResponse insertNewRecord(String partNumber, String location,
                                              int quantity, String mode,
                                              String userName, LocalDateTime now) {
        Optional<PartMaster> partOpt = partMasterRepository.findByPartnumber(partNumber);

        CountingRecord record = new CountingRecord();
        record.setDealerId(0);
        record.setUserName(userName);
        record.setPartnumber(partNumber);
        record.setLocation(location);
        record.setCount(quantity);
        record.setDateadded(now);
        record.setDatemodi(now);
        record.setRecheckFlag("N");
        record.setFinalQty(quantity);
        record.setCountingby(mode);
        record.setModicount(0);
        record.setRecheckCount(0);
        record.setRecheckUser("");
        record.setRecheckRemark("");
        record.setRecheckDateadded(now);
        record.setTransactedPart("N");

        if (partOpt.isPresent()) {
            PartMaster part = partOpt.get();
            record.setPartdesc(part.getPartDescription());
            record.setPartPrice(part.getLandedcost());
            record.setCategory(part.getCategory());
            record.setRemark(part.getRemark() != null ? part.getRemark() : "");
            record.setMoq(part.getMoq() != null ? part.getMoq() : 0);
            record.setNotInPartMaster("0");
        } else {
            record.setPartdesc("");
            record.setPartPrice(BigDecimal.ZERO);
            record.setCategory("");
            record.setRemark("");
            record.setMoq(0);
            record.setNotInPartMaster("1");
        }

        countingRecordRepository.save(record);

        return new CountingResponse("Record created", false, null);
    }

    @Transactional
    public void updateMultiLocationQuantities(List<MultiLocationUpdateItem> updates) {
        for (MultiLocationUpdateItem item : updates) {
            CountingRecord record = countingRecordRepository.findById(item.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Counting record not found with ID: " + item.getId()));
            record.setFinalQty(item.getFinalQty());
            countingRecordRepository.save(record);
        }
    }

    public CountingRecord updateCountingRecord(Integer id, UpdateFormRequest request, String userName) {
        CountingRecord record = countingRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Counting record not found with ID: " + id));

        LocalDateTime now = LocalDateTime.now();
        record.setPartnumber(request.getPartNumber());
        record.setLocation(request.getLocation());
        record.setRemark(request.getRemark() != null ? request.getRemark() : "");
        record.setFinalQty(request.getQuantity());
        record.setDatemodi(now);
        record.setRecheckCount(request.getQuantity());
        record.setRecheckDateadded(now);
        record.setRecheckFlag("Y");
        record.setModicount(record.getModicount() != null ? record.getModicount() + 1 : 1);
        record.setRecheckRemark(request.getRemark() != null ? request.getRemark() : "");
        record.setRecheckUser(userName);

        return countingRecordRepository.save(record);
    }
}
