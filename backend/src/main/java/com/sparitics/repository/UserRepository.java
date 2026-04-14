package com.sparitics.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sparitics.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUserIdAndPasswordAndUserType(String userId, String password, String userType);

    List<User> findByUserIdAndUserType(String userId, String userType);

    List<User> findByUserId(String userId);
}
