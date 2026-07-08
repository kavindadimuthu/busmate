package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.UserType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserTypeRepository extends JpaRepository<UserType, UUID> {
    Optional<UserType> findByName(String name);
}
