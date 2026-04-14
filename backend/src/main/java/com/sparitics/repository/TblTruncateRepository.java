package com.sparitics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.sparitics.entity.TblTruncate;

@Repository
public interface TblTruncateRepository extends JpaRepository<TblTruncate, Integer> {

    @Modifying
    @Transactional
    @Query(value = "TRUNCATE TABLE tblTruncate", nativeQuery = true)
    void truncateAll();
}
