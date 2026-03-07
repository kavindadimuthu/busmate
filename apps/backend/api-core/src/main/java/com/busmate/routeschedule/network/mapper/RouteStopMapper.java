package com.busmate.routeschedule.network.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.entity.RouteStop;

/**
 * MapStruct mapper for {@link RouteStop} entity → {@link RouteResponse.RouteStopResponse} DTO.
 *
 * <p>Uses {@link StopMapper} for the nested {@code Stop.Location → LocationDto} conversion.
 * The {@code id} field maps the RouteStop entity's PK (not the stop's PK), which is used
 * by the frontend to address individual route-stop entries during updates.
 */
@Mapper(componentModel = "spring", uses = {StopMapper.class})
public interface RouteStopMapper {

    /**
     * Converts a {@link RouteStop} JPA entity to a {@link RouteResponse.RouteStopResponse}.
     *
     * <ul>
     *   <li>{@code id}       – the RouteStop entity's own primary key</li>
     *   <li>{@code stopId}   – the referenced Stop's primary key</li>
     *   <li>{@code stopName} – the Stop's English name</li>
     *   <li>{@code location} – mapped via {@link StopMapper#toLocationDto}</li>
     * </ul>
     */
    @Mapping(target = "stopId", source = "stop.id")
    @Mapping(target = "stopName", source = "stop.name")
    @Mapping(target = "location", source = "stop.location")
    RouteResponse.RouteStopResponse toRouteStopResponse(RouteStop entity);
}
