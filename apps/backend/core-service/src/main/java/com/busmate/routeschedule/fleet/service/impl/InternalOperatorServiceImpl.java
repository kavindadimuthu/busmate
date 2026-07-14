package com.busmate.routeschedule.fleet.service.impl;

import com.busmate.routeschedule.fleet.dto.internal.InternalOperatorRequest;
import com.busmate.routeschedule.fleet.dto.internal.InternalOperatorStatusRequest;
import com.busmate.routeschedule.fleet.dto.response.OperatorResponse;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.OperatorTypeEnum;
import com.busmate.routeschedule.fleet.repository.OperatorRepository;
import com.busmate.routeschedule.fleet.service.InternalOperatorService;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InternalOperatorServiceImpl implements InternalOperatorService {

    /** Stamped as createdBy/updatedBy for writes made through /internal/operators — there is
     *  no authenticated principal on this path, only the shared API key. */
    private static final String INTERNAL_ACTOR = "internal:user-service";

    private final OperatorRepository operatorRepository;
    private final MapperUtils mapperUtils;

    @Override
    public OperatorSyncResult createOrGetOperator(InternalOperatorRequest request) {
        var existing = operatorRepository.findByUserId(request.getUserId());
        if (existing.isPresent()) {
            return new OperatorSyncResult(mapToResponse(existing.get()), false);
        }

        OperatorTypeEnum operatorType = parseOperatorType(request.getOperatorType());
        StatusEnum status = parseStatus(request.getStatus());

        if (operatorRepository.existsByName(request.getName())) {
            throw new ConflictException("Operator with name " + request.getName() + " already exists");
        }

        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setUserId(request.getUserId());
        operator.setName(request.getName());
        operator.setOperatorType(operatorType);
        operator.setRegion(request.getRegion());
        operator.setStatus(status);
        operator.setCreatedBy(INTERNAL_ACTOR);
        operator.setUpdatedBy(INTERNAL_ACTOR);

        Operator saved = operatorRepository.save(operator);
        log.info("Created Operator {} linked to userId {} via internal sync", saved.getId(), saved.getUserId());
        return new OperatorSyncResult(mapToResponse(saved), true);
    }

    @Override
    public OperatorResponse updateOperatorByUserId(UUID userId, InternalOperatorRequest request) {
        Operator operator = findByUserIdOrThrow(userId);

        OperatorTypeEnum operatorType = parseOperatorType(request.getOperatorType());
        StatusEnum status = parseStatus(request.getStatus());

        if (!operator.getName().equals(request.getName()) && operatorRepository.existsByName(request.getName())) {
            throw new ConflictException("Operator with name " + request.getName() + " already exists");
        }

        operator.setName(request.getName());
        operator.setOperatorType(operatorType);
        operator.setRegion(request.getRegion());
        operator.setStatus(status);
        operator.setUpdatedBy(INTERNAL_ACTOR);

        Operator saved = operatorRepository.save(operator);
        return mapToResponse(saved);
    }

    @Override
    public OperatorResponse updateStatusByUserId(UUID userId, InternalOperatorStatusRequest request) {
        Operator operator = findByUserIdOrThrow(userId);
        operator.setStatus(parseStatus(request.getStatus()));
        operator.setUpdatedBy(INTERNAL_ACTOR);

        Operator saved = operatorRepository.save(operator);
        return mapToResponse(saved);
    }

    private Operator findByUserIdOrThrow(UUID userId) {
        return operatorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No Operator linked to userId: " + userId));
    }

    private OperatorTypeEnum parseOperatorType(String operatorType) {
        try {
            return OperatorTypeEnum.valueOf(operatorType);
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid operator type: " + operatorType);
        }
    }

    private StatusEnum parseStatus(String status) {
        try {
            return StatusEnum.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + status);
        }
    }

    private OperatorResponse mapToResponse(Operator operator) {
        return mapperUtils.map(operator, OperatorResponse.class);
    }
}
