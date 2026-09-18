package com.busmate.routeschedule.fleet.security;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.repository.OperatorRepository;
import com.busmate.routeschedule.shared.exception.ForbiddenException;
import com.busmate.routeschedule.shared.security.Caller;
import com.busmate.routeschedule.shared.security.CallerContext;

import lombok.RequiredArgsConstructor;

/**
 * Decides which operator's records the caller may touch (INC-016).
 *
 * <p>An operator is resolved from their own account through {@code Operator.userId} — never from
 * an id the client sent. MOT and admin act on any operator. Everyone else acts on none.
 */
@Component
@RequiredArgsConstructor
public class OperatorAccess {

    private final CallerContext callerContext;
    private final OperatorRepository operatorRepository;

    /**
     * Refuses unless the caller may act on {@code operatorId}: staff always, an operator only on
     * their own record.
     */
    public Caller requireAccess(UUID operatorId) {
        Caller caller = callerContext.require();
        if (caller.isStaff()) {
            return caller;
        }
        if (caller.isOperator() && operatorId != null && operatorId.equals(ownOperatorId(caller))) {
            return caller;
        }
        throw new ForbiddenException("You can only access your own operator's records");
    }

    /** The calling operator's own Operator id; refuses a caller who is not a linked operator. */
    public UUID requireOwnOperatorId() {
        Caller caller = callerContext.require();
        if (!caller.isOperator()) {
            throw new ForbiddenException("Only an operator account has its own operator records");
        }
        return ownOperatorId(caller);
    }

    /**
     * For endpoints both staff and operators use: null for staff (no restriction), the caller's
     * own operator id for an operator, refusal for anyone else.
     */
    public UUID scopeFor(Caller caller) {
        if (caller.isStaff()) {
            return null;
        }
        if (caller.isOperator()) {
            return ownOperatorId(caller);
        }
        throw new ForbiddenException("Not permitted");
    }

    private UUID ownOperatorId(Caller caller) {
        if (caller.userId() == null) {
            throw new ForbiddenException("No operator record is linked to this account");
        }
        return operatorRepository.findByUserId(caller.userId())
                .map(Operator::getId)
                .orElseThrow(() -> new ForbiddenException("No operator record is linked to this account"));
    }
}
