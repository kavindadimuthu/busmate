package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.UserIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserIdentityRepository extends JpaRepository<UserIdentity, UUID> {
    Optional<UserIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);
    List<UserIdentity> findByUserId(UUID userId);
}
