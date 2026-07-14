package com.busmate.routeschedule.network.mapper;

import java.util.Comparator;

import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.entity.Route;

/**
 * MapStruct mapper for {@link Route} entity → {@link RouteResponse} DTO.
 *
 * <p>Delegates nested mappings to {@link StopMapper} (for Location/LocationDto) and
 * {@link RouteStopMapper} (for List&lt;RouteStop&gt; → List&lt;RouteStopResponse&gt;).
 *
 * <p>Key mapping decisions:
 * <ul>
 *   <li>Enum fields ({@code direction}, {@code roadType}) are mapped to {@code String} via
 *       MapStruct's built-in {@code Enum.name()} conversion.</li>
 *   <li>Nested route-group and stop identifiers/names are mapped with explicit source paths.</li>
 *   <li>An {@link AfterMapping} hook sorts {@code routeStops} by {@code stopOrder} so the
 *       consumer always receives an ordered list without requiring additional service code.</li>
 * </ul>
 */
@Mapper(componentModel = "spring", uses = {StopMapper.class, RouteStopMapper.class})
public interface RouteMapper {

    @Mapping(target = "routeGroupId", source = "routeGroup.id")
    @Mapping(target = "routeGroupName", source = "routeGroup.name")
    @Mapping(target = "routeGroupNameSinhala", source = "routeGroup.nameSinhala")
    @Mapping(target = "routeGroupNameTamil", source = "routeGroup.nameTamil")
    @Mapping(target = "startStopId", source = "startStop.id")
    @Mapping(target = "startStopName", source = "startStop.name")
    @Mapping(target = "startStopLocation", source = "startStop.location")
    @Mapping(target = "endStopId", source = "endStop.id")
    @Mapping(target = "endStopName", source = "endStop.name")
    @Mapping(target = "endStopLocation", source = "endStop.location")
    // Enum → String: MapStruct uses Enum.name() automatically
    @Mapping(target = "direction", source = "direction")
    @Mapping(target = "roadType", source = "roadType")
    // routeStops: List<RouteStop> → List<RouteStopResponse> via RouteStopMapper
    @Mapping(target = "routeStops", source = "routeStops")
    RouteResponse toResponse(Route entity);

    /**
     * Sorts route stops by their sequential order after the primary mapping is complete.
     * This ensures the response list is always ordered without requiring callers to sort.
     */
    @AfterMapping
    default void sortRouteStops(@MappingTarget RouteResponse response) {
        if (response.getRouteStops() != null) {
            response.getRouteStops().sort(Comparator.comparingInt(RouteResponse.RouteStopResponse::getStopOrder));
        }
    }
}
