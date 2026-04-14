package com.sparitics.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.sparitics.entity.CountingRecord;

@Repository
public interface CountingRecordRepository extends JpaRepository<CountingRecord, Integer> {

    List<CountingRecord> findByPartnumber(String partnumber);

    Optional<CountingRecord> findByPartnumberAndLocation(String partnumber, String location);

    @Modifying
    @Transactional
    @Query(value = "TRUNCATE TABLE tblCounting", nativeQuery = true)
    void truncateAll();
}
