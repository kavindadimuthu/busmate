package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.PassengerServicePermitRequest;
import com.busmate.routeschedule.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.dto.response.PaginatedResponse;
import com.busmate.routeschedule.entity.PassengerServicePermit;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.entity.RouteGroup;
import com.busmate.routeschedule.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
//import com.busmate.routeschedule.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.repository.PassengerServicePermitRepository;
import com.busmate.routeschedule.repository.OperatorRepository;
import com.busmate.routeschedule.repository.RouteGroupRepository;
import com.busmate.routeschedule.service.PassengerServicePermitService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PassengerServicePermitServiceImpl implements PassengerServicePermitService {
    private final PassengerServicePermitRepository permitRepository;
    private final OperatorRepository operatorRepository;
    private final RouteGroupRepository routeGroupRepository;
//    private final BusPassengerServicePermitAssignmentRepository busPermitAssignmentRepository;
    private final MapperUtils mapperUtils;

    @Override
    public PassengerServicePermitResponse createPermit(PassengerServicePermitRequest request, String userId) {
        validatePermitRequest(request);
        Operator operator = validateAndGetOperator(request.getOperatorId());
        RouteGroup routeGroup = validateAndGetRouteGroup(request.getRouteGroupId());
        if (permitRepository.existsByPermitNumber(request.getPermitNumber())) {
            throw new ConflictException("Permit with number " + request.getPermitNumber() + " already exists");
        }

        PassengerServicePermit permit = mapToPermit(request, userId, operator, routeGroup);
        PassengerServicePermit savedPermit = permitRepository.save(permit);
        return mapToResponse(savedPermit);
    }

    @Override
    public PassengerServicePermitResponse getPermitById(UUID id) {
        PassengerServicePermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found with id: " + id));
        return mapToResponse(permit);
    }

    @Override
    public List<PassengerServicePermitResponse> getAllPermits() {
        return permitRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<PassengerServicePermitResponse> getPermits(Pageable pageable, String status, String permitType, String operatorName, String routeGroupName) {
        Specification<PassengerServicePermit> specification = createSpecification(status, permitType, operatorName, routeGroupName);
        Page<PassengerServicePermit> permitPage = permitRepository.findAll(specification, pageable);
        
        List<PassengerServicePermitResponse> content = permitPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return PaginatedResponse.of(content, pageable.getPageNumber(), pageable.getPageSize(), permitPage.getTotalElements());
    }

    @Override
    public List<PassengerServicePermitResponse> getPermitsByRouteGroupId(UUID routeGroupId) {
        // Validate that route group exists
        routeGroupRepository.findById(routeGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + routeGroupId));
        
        return permitRepository.findByRouteGroupId(routeGroupId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PassengerServicePermitResponse updatePermit(UUID id, PassengerServicePermitRequest request, String userId) {
        PassengerServicePermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found with id: " + id));

        validatePermitRequest(request);
        Operator operator = validateAndGetOperator(request.getOperatorId());
        RouteGroup routeGroup = validateAndGetRouteGroup(request.getRouteGroupId());
        if (!permit.getPermitNumber().equals(request.getPermitNumber()) &&
                permitRepository.existsByPermitNumber(request.getPermitNumber())) {
            throw new ConflictException("Permit with number " + request.getPermitNumber() + " already exists");
        }

        // Store the original ID to avoid overwriting it
        UUID originalId = permit.getId();
        
        // Update fields manually instead of using mapperUtils to avoid ID conflicts
        permit.setPermitNumber(request.getPermitNumber());
        permit.setIssueDate(request.getIssueDate());
        permit.setExpiryDate(request.getExpiryDate());
        permit.setMaximumBusAssigned(request.getMaximumBusAssigned());
        permit.setOperator(operator);
        permit.setRouteGroup(routeGroup);
        
        try {
            permit.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        try {
            permit.setPermitType(PassengerServicePermitTypeEnum.valueOf(request.getPermitType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid permit type: " + request.getPermitType());
        }
        
        // Ensure the ID remains unchanged
        permit.setId(originalId);
        permit.setUpdatedBy(userId);

        PassengerServicePermit updatedPermit = permitRepository.save(permit);
        return mapToResponse(updatedPermit);
    }

    @Override
    public void deletePermit(UUID id) {
        PassengerServicePermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found with id: " + id));

//        if (busPermitAssignmentRepository.existsByPermitId(id)) {
//            throw new ConflictException("Cannot delete permit with id " + id + " as it is referenced by bus assignments");
//        }

        permitRepository.deleteById(id);
    }

    private void validatePermitRequest(PassengerServicePermitRequest request) {
        if (request.getExpiryDate() != null && request.getExpiryDate().isBefore(request.getIssueDate())) {
            throw new ConflictException("Expiry date cannot be before issue date");
        }
        if (request.getMaximumBusAssigned() <= 0) {
            throw new ConflictException("Maximum bus assigned must be positive");
        }
        try {
            StatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        try {
            PassengerServicePermitTypeEnum.valueOf(request.getPermitType());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid permit type: " + request.getPermitType());
        }
    }

    private Operator validateAndGetOperator(UUID operatorId) {
        return operatorRepository.findById(operatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + operatorId));
    }

    private RouteGroup validateAndGetRouteGroup(UUID routeGroupId) {
        return routeGroupRepository.findById(routeGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + routeGroupId));
    }

    private PassengerServicePermit mapToPermit(PassengerServicePermitRequest request, String userId, Operator operator, RouteGroup routeGroup) {
        PassengerServicePermit permit = mapperUtils.map(request, PassengerServicePermit.class);
        permit.setId(null); // Ensure ID is null for new entities
        permit.setOperator(operator);
        permit.setRouteGroup(routeGroup);
        try {
            permit.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        try {
            permit.setPermitType(PassengerServicePermitTypeEnum.valueOf(request.getPermitType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid permit type: " + request.getPermitType());
        }
        permit.setCreatedBy(userId);
        permit.setUpdatedBy(userId);
        return permit;
    }

    private PassengerServicePermitResponse mapToResponse(PassengerServicePermit permit) {
        PassengerServicePermitResponse response = mapperUtils.map(permit, PassengerServicePermitResponse.class);
        response.setOperatorId(permit.getOperator().getId());
        response.setOperatorName(permit.getOperator().getName());
        response.setRouteGroupId(permit.getRouteGroup().getId());
        response.setRouteGroupName(permit.getRouteGroup().getName());
        return response;
    }

    private Specification<PassengerServicePermit> createSpecification(String status, String permitType, String operatorName, String routeGroupName) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (status != null && !status.trim().isEmpty()) {
                try {
                    StatusEnum statusEnum = StatusEnum.valueOf(status.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException e) {
                    // Invalid status, ignore or throw exception
                }
            }
            
            if (permitType != null && !permitType.trim().isEmpty()) {
                try {
                    PassengerServicePermitTypeEnum permitTypeEnum = PassengerServicePermitTypeEnum.valueOf(permitType.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("permitType"), permitTypeEnum));
                } catch (IllegalArgumentException e) {
                    // Invalid permit type, ignore or throw exception
                }
            }
            
            if (operatorName != null && !operatorName.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("operator").get("name")), 
                    "%" + operatorName.toLowerCase() + "%"
                ));
            }
            
            if (routeGroupName != null && !routeGroupName.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("routeGroup").get("name")), 
                    "%" + routeGroupName.toLowerCase() + "%"
                ));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
