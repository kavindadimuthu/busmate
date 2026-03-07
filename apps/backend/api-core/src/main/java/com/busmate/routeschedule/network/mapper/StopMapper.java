package com.busmate.routeschedule.network.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.shared.dto.LocationDto;

/**
 * MapStruct mapper for Stop entity ↔ DTO conversions.
 *
 * <p>Provides compile-time generated, type-safe, reflection-free mapping between
 * the Stop JPA entity and its request/response DTOs. The embedded
 * {@link Stop.Location} type and {@link LocationDto} share identical fields, so
 * MapStruct maps them automatically by name.
 */
@Mapper(componentModel = "spring")
public interface StopMapper {

    // ──────────────────────── Entity → Response ────────────────────────

    StopResponse toResponse(Stop entity);

    // ──────────────────────── Location conversion ──────────────────────

    LocationDto toLocationDto(Stop.Location location);

    Stop.Location toStopLocation(LocationDto dto);

    // ──────────────────────── Request → Entity ─────────────────────────

    /**
     * Maps a {@link StopRequest} to a new {@link Stop} entity.
     * Audit/version fields managed by JPA are excluded from mapping.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    Stop toEntity(StopRequest request);

    /**
     * Updates an existing {@link Stop} entity in-place from a {@link StopRequest}.
     * Identity and audit fields are preserved.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntityFromRequest(StopRequest request, @MappingTarget Stop entity);
}
