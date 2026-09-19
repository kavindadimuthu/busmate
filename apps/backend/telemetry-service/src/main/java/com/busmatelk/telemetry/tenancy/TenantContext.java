package com.busmatelk.telemetry.tenancy;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Declares who is acting on the current transaction so the database's row-level security policies
 * can decide what they may see or write (INC-024, ADR-016). The values are set with
 * {@code set_config(..., true)}: transaction-local, so they cannot outlive the transaction and a
 * pooled connection can never carry one caller's context to the next.
 *
 * <p>Declaring outside a transaction is an error ({@link Propagation#MANDATORY}) — a transaction-local
 * setting made without one would silently apply to a single statement and protect nothing.
 *
 * <p>This protects against a wrong query, not against compromised service code, which could declare
 * any context it likes. Who may call which method is therefore the thing to review: {@link #asIngest()}
 * belongs to the device-authenticated ingest pipeline only.
 */
@Component
public class TenantContext {

    public static final String ACTOR_INGEST = "ingest";
    public static final String ACTOR_STAFF = "staff";
    public static final String ACTOR_OPERATOR = "operator";

    @PersistenceContext
    private EntityManager entityManager;

    /** The device-authenticated ingest pipeline: the only actor allowed to write vehicle data. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void asIngest() {
        declare(ACTOR_INGEST, "");
    }

    /** MOT and admin: read every operator's data. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void asStaff() {
        declare(ACTOR_STAFF, "");
    }

    /** One operator: read only their own rows. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void asOperator(UUID operatorId) {
        declare(ACTOR_OPERATOR, operatorId.toString());
    }

    private void declare(String actor, String operatorId) {
        entityManager.createNativeQuery("select set_config('app.actor', :actor, true), set_config('app.operator_id', :operator, true)")
                .setParameter("actor", actor)
                .setParameter("operator", operatorId)
                .getResultList();
    }
}
