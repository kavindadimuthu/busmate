package com.busmate.routeschedule.network.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.busmate.routeschedule.network.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.network.dto.response.RouteGroupResponse;
import com.busmate.routeschedule.network.entity.RouteGroup;

/**
 * MapStruct mapper for {@link RouteGroup} entity ↔ DTO conversions.
 *
 * <p>Delegates nested {@code Route → RouteResponse} mappings to {@link RouteMapper}, which
 * in turn handles the stop and route-stop sub-mappings.
 *
 * <p><b>Note:</b> The {@code request → entity} mapping ({@link #toEntity}) only populates
 * scalar fields on {@link RouteGroup}. Child routes require database lookups (starting/ending
 * stop resolution) and are therefore managed manually in the service layer.
 */
@Mapper(componentModel = "spring", uses = {RouteMapper.class})
public interface RouteGroupMapper {

    // ──────────────────────── Entity → Response ────────────────────────

    /**
     * Converts a {@link RouteGroup} entity to a {@link RouteGroupResponse}, including all
     * nested routes. Ensure the entity is loaded within an active JPA session so that
     * lazy associations are accessible.
     */
    RouteGroupResponse toResponse(RouteGroup entity);

    // ──────────────────────── Request → Entity ─────────────────────────

    /**
     * Maps scalar fields from a {@link RouteGroupRequest} onto a new {@link RouteGroup} entity.
     * The {@code routes} collection is intentionally ignored here; the service layer handles
     * child route creation and linking after calling this method.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "routes", ignore = true)
    RouteGroup toEntity(RouteGroupRequest request);

    /**
     * Updates scalar fields of an existing {@link RouteGroup} entity from a
     * {@link RouteGroupRequest}. Child routes are managed separately by the service.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "routes", ignore = true)
    void updateEntityFromRequest(RouteGroupRequest request, @MappingTarget RouteGroup entity);
}
