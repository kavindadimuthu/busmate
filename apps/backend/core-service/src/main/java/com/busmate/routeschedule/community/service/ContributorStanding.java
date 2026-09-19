package com.busmate.routeschedule.community.service;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.repository.ContributorRepository;

import lombok.RequiredArgsConstructor;

/**
 * What a user may do to the network, asked on every request and never cached, so a suspension takes
 * effect on the next request rather than the next login (ADR-019). Fails closed: no row, any status but
 * ACTIVE, or an agreement older than the one in force all mean reporter rights only.
 */
@Component
@RequiredArgsConstructor
public class ContributorStanding {

    private final ContributorRepository contributors;
    private final ContributorAgreement agreement;

    @Transactional(readOnly = true)
    public boolean isActiveContributor(UUID userId) {
        if (userId == null) {
            return false;
        }
        return contributors.findById(userId).map(this::isActive).orElse(false);
    }

    public boolean isActive(Contributor c) {
        return c.getStatus() == ContributorStatus.ACTIVE && agreement.version().equals(c.getAgreementVersion());
    }
}
