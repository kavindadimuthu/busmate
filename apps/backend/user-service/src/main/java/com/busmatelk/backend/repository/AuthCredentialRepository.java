package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.AuthCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuthCredentialRepository extends JpaRepository<AuthCredential, UUID> {
}
