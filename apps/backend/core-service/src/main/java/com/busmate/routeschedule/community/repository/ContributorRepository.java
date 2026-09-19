package com.busmate.routeschedule.community.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;

public interface ContributorRepository extends JpaRepository<Contributor, UUID> {

    Page<Contributor> findByStatus(ContributorStatus status, Pageable pageable);

    long countByStatus(ContributorStatus status);
}
