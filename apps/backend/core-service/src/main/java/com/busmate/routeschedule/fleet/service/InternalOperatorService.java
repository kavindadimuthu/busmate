package com.busmate.routeschedule.fleet.service;

import com.busmate.routeschedule.fleet.dto.internal.InternalOperatorRequest;
import com.busmate.routeschedule.fleet.dto.internal.InternalOperatorStatusRequest;
import com.busmate.routeschedule.fleet.dto.response.OperatorResponse;

import java.util.UUID;

/**
 * Backs /internal/operators — the receiving side of the unified operator lifecycle sync
 * from user-service. Kept separate from OperatorService (the MOT-dashboard-facing CRUD
 * service) the same way PermissionAdminService is kept separate from PermissionService:
 * different caller, different trust boundary, different idempotency requirements.
 */
public interface InternalOperatorService {

    /**
     * Idempotent by userId: if an Operator already exists for this userId, it is returned
     * as-is (not re-created, not overwritten) so outbox retries are safe to replay.
     *
     * @return the created (or pre-existing) Operator, and whether it was newly created
     */
    OperatorSyncResult createOrGetOperator(InternalOperatorRequest request);

    OperatorResponse updateOperatorByUserId(UUID userId, InternalOperatorRequest request);

    OperatorResponse updateStatusByUserId(UUID userId, InternalOperatorStatusRequest request);

    record OperatorSyncResult(OperatorResponse operator, boolean created) {
    }
}
