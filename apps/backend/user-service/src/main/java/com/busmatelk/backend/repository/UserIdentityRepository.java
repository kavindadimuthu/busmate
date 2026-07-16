package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.UserIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserIdentityRepository extends JpaRepository<UserIdentity, UUID> {
    Optional<UserIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);
    List<UserIdentity> findByUserId(UUID userId);

    /** Bulk delete — account deletion purges every identity (local + any linked social ones). */
    @Modifying(clearAutomatically = true)
    @Query("delete from UserIdentity i where i.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
