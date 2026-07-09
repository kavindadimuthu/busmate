package com.busmatelk.backend.operator;

import java.util.UUID;

/**
 * Wire shape sent to core-service's /internal/operators (mirrors InternalOperatorRequest
 * there exactly). Field mapping — see docs/plans/Unified-Operator-Lifecycle-Management-Plan.md:
 * name &lt;- profileData.organization_name, operatorType &lt;- profileData.operator_type,
 * region &lt;- profileData.region, status &lt;- accountStatus.
 */
public record OperatorSyncPayload(UUID userId, String name, String operatorType, String region, String status) {
}
