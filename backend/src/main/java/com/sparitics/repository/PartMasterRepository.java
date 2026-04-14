package com.sparitics.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.sparitics.entity.PartMaster;

@Repository
public interface PartMasterRepository extends JpaRepository<PartMaster, Integer> {

    Optional<PartMaster> findByPartnumber(String partnumber);

    List<PartMaster> findTop10ByPartnumberStartingWith(String prefix);

    List<PartMaster> findTop10ByPartnumberContaining(String query);

    boolean existsByPartnumber(String partnumber);

    @Modifying
    @Transactional
    @Query(value = "TRUNCATE TABLE PartMaster", nativeQuery = true)
    void truncateAll();
}
