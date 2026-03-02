package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.dto.response.RouteGroupResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface RouteGroupService {
    RouteGroupResponse createRouteGroup(RouteGroupRequest request, String userId);
    RouteGroupResponse getRouteGroupById(UUID id);
    List<RouteGroupResponse> getAllRouteGroups();
    Page<RouteGroupResponse> getAllRouteGroups(Pageable pageable);
    Page<RouteGroupResponse> getAllRouteGroupsWithSearch(String searchText, Pageable pageable);
    RouteGroupResponse updateRouteGroup(UUID id, RouteGroupRequest request, String userId);
    void deleteRouteGroup(UUID id);
}