package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.OperatorRequest;
import com.busmate.routeschedule.dto.response.OperatorResponse;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.OperatorRepository;
import com.busmate.routeschedule.service.OperatorService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperatorServiceImpl implements OperatorService {
    private final OperatorRepository operatorRepository;
    private final MapperUtils mapperUtils;

    @Override
    public OperatorResponse createOperator(OperatorRequest request, String userId) {
        validateOperatorRequest(request);
        if (operatorRepository.existsByName(request.getName())) {
            throw new ConflictException("Operator with name " + request.getName() + " already exists");
        }

        Operator operator = mapToOperator(request, userId);
        Operator savedOperator = operatorRepository.save(operator);
        return mapToResponse(savedOperator);
    }

    @Override
    public OperatorResponse getOperatorById(UUID id) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + id));
        return mapToResponse(operator);
    }

    @Override
    public List<OperatorResponse> getAllOperators() {
        return operatorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<OperatorResponse> getAllOperators(Pageable pageable) {
        Page<Operator> operators = operatorRepository.findAll(pageable);
        return operators.map(this::mapToResponse);
    }

    @Override
    public Page<OperatorResponse> getAllOperatorsWithFilters(String searchText, OperatorTypeEnum operatorType, StatusEnum status, Pageable pageable) {
        String operatorTypeStr = operatorType != null ? operatorType.name() : null;
        String statusStr = status != null ? status.name() : null;
        
        Page<Operator> operators = operatorRepository.findAllWithFilters(searchText, operatorTypeStr, statusStr, pageable);
        return operators.map(this::mapToResponse);
    }

    @Override
    public OperatorResponse updateOperator(UUID id, OperatorRequest request, String userId) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + id));

        validateOperatorRequest(request);
        if (!operator.getName().equals(request.getName()) &&
                operatorRepository.existsByName(request.getName())) {
            throw new ConflictException("Operator with name " + request.getName() + " already exists");
        }

        mapperUtils.map(request, operator);
        try {
            operator.setOperatorType(OperatorTypeEnum.valueOf(request.getOperatorType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid operator type: " + request.getOperatorType());
        }
        try {
            operator.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        operator.setUpdatedBy(userId);

        Operator updatedOperator = operatorRepository.save(operator);
        return mapToResponse(updatedOperator);
    }

    @Override
    public void deleteOperator(UUID id) {
        if (!operatorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Operator not found with id: " + id);
        }
        operatorRepository.deleteById(id);
    }

    private void validateOperatorRequest(OperatorRequest request) {
        try {
            OperatorTypeEnum.valueOf(request.getOperatorType());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid operator type: " + request.getOperatorType());
        }
        try {
            StatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
    }

    private Operator mapToOperator(OperatorRequest request, String userId) {
        Operator operator = mapperUtils.map(request, Operator.class);
        try {
            operator.setOperatorType(OperatorTypeEnum.valueOf(request.getOperatorType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid operator type: " + request.getOperatorType());
        }
        try {
            operator.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        operator.setCreatedBy(userId);
        operator.setUpdatedBy(userId);
        return operator;
    }

    private OperatorResponse mapToResponse(Operator operator) {
        return mapperUtils.map(operator, OperatorResponse.class);
    }
}
