package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.passenger.controller.PassengerController;
import com.busmate.routeschedule.passenger.dto.response.PassengerTripResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerPaginatedResponse;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.passenger.service.PassengerTripService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class to verify the fixed PassengerController trip APIs
 * Tests all the critical filtering functionality that was previously missing
 */
@WebMvcTest(PassengerController.class)
class PassengerTripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PassengerTripService passengerTripService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testSearchTrips_WithAllFilters_ShouldPassAllParametersToService() throws Exception {
        // Arrange
        UUID fromStopId = UUID.randomUUID();
        UUID toStopId = UUID.randomUUID();
        UUID routeId = UUID.randomUUID();
        UUID operatorId = UUID.randomUUID();
        LocalDate travelDate = LocalDate.of(2025, 10, 19);
        LocalTime departureTimeFrom = LocalTime.of(8, 0);
        LocalTime departureTimeTo = LocalTime.of(18, 0);
        OperatorTypeEnum operatorType = OperatorTypeEnum.PRIVATE;
        TripStatusEnum status = TripStatusEnum.active;

        PassengerPaginatedResponse<PassengerTripResponse> mockResponse = 
                PassengerPaginatedResponse.<PassengerTripResponse>builder()
                        .content(new ArrayList<>())
                        .currentPage(0)
                        .size(20)
                        .totalElements(0L)
                        .totalPages(0)
                        .first(true)
                        .last(true)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build();

        when(passengerTripService.searchTrips(
                eq(fromStopId), eq(toStopId), eq(null), eq(null), eq(routeId),
                eq(travelDate), eq(departureTimeFrom), eq(departureTimeTo),
                eq(operatorType), eq(operatorId), eq(status),
                eq(null), eq(null), eq(null), any(Pageable.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/passenger/trips/search")
                        .param("fromStopId", fromStopId.toString())
                        .param("toStopId", toStopId.toString())
                        .param("routeId", routeId.toString())
                        .param("operatorId", operatorId.toString())
                        .param("travelDate", travelDate.toString())
                        .param("departureTimeFrom", departureTimeFrom.toString())
                        .param("departureTimeTo", departureTimeTo.toString())
                        .param("operatorType", operatorType.toString())
                        .param("status", status.toString())
                        .param("page", "0")
                        .param("size", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.currentPage").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));

        // Verify all parameters are passed correctly to service
        verify(passengerTripService).searchTrips(
                fromStopId, toStopId, null, null, routeId,
                travelDate, departureTimeFrom, departureTimeTo,
                operatorType, operatorId, status,
                null, null, null, PageRequest.of(0, 20)
        );
    }

    @Test
    void testSearchTrips_WithRouteIdOnly_ShouldWork() throws Exception {
        // Test the specific routeId filter that was previously not working
        UUID routeId = UUID.randomUUID();

        PassengerPaginatedResponse<PassengerTripResponse> mockResponse = 
                PassengerPaginatedResponse.<PassengerTripResponse>builder()
                        .content(createSampleTripResponses())
                        .currentPage(0)
                        .size(20)
                        .totalElements(2L)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build();

        when(passengerTripService.searchTrips(
                eq(null), eq(null), eq(null), eq(null), eq(routeId),
                eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null), any(Pageable.class)
        )).thenReturn(mockResponse);

        mockMvc.perform(get("/api/passenger/trips/search")
                        .param("routeId", routeId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2));

        verify(passengerTripService).searchTrips(
                null, null, null, null, routeId,
                null, null, null,
                null, null, null,
                null, null, null, PageRequest.of(0, 20)
        );
    }

    @Test
    void testSearchTrips_WithOperatorTypeOnly_ShouldWork() throws Exception {
        // Test the specific operatorType filter that was previously not working
        OperatorTypeEnum operatorType = OperatorTypeEnum.CTB;

        PassengerPaginatedResponse<PassengerTripResponse> mockResponse = 
                PassengerPaginatedResponse.<PassengerTripResponse>builder()
                        .content(createSampleTripResponses())
                        .currentPage(0)
                        .size(20)
                        .totalElements(2L)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build();

        when(passengerTripService.searchTrips(
                eq(null), eq(null), eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null),
                eq(operatorType), eq(null), eq(null),
                eq(null), eq(null), eq(null), any(Pageable.class)
        )).thenReturn(mockResponse);

        mockMvc.perform(get("/api/passenger/trips/search")
                        .param("operatorType", operatorType.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));

        verify(passengerTripService).searchTrips(
                null, null, null, null, null,
                null, null, null,
                operatorType, null, null,
                null, null, null, PageRequest.of(0, 20)
        );
    }

    @Test
    void testGetActiveTrips_WithAllFilters_ShouldWork() throws Exception {
        // Test the active trips API with all filters
        UUID routeId = UUID.randomUUID();
        UUID operatorId = UUID.randomUUID();
        OperatorTypeEnum operatorType = OperatorTypeEnum.PRIVATE;
        Double latitude = 6.9271;
        Double longitude = 79.8612;
        Double radius = 5.0;

        PassengerPaginatedResponse<PassengerTripResponse> mockResponse = 
                PassengerPaginatedResponse.<PassengerTripResponse>builder()
                        .content(createSampleTripResponses())
                        .currentPage(0)
                        .size(20)
                        .totalElements(2L)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build();

        when(passengerTripService.getActiveTrips(
                eq(routeId), eq(null), eq(null), eq(latitude), eq(longitude), eq(radius),
                eq(operatorType), eq(operatorId), eq(null), eq(null), any(Pageable.class)
        )).thenReturn(mockResponse);

        mockMvc.perform(get("/api/passenger/trips/active")
                        .param("routeId", routeId.toString())
                        .param("operatorType", operatorType.toString())
                        .param("operatorId", operatorId.toString())
                        .param("latitude", latitude.toString())
                        .param("longitude", longitude.toString())
                        .param("radius", radius.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));

        verify(passengerTripService).getActiveTrips(
                routeId, null, null, latitude, longitude, radius,
                operatorType, operatorId, null, null, PageRequest.of(0, 20)
        );
    }

    @Test
    void testSearchTrips_WithFromAndToStops_ShouldWork() throws Exception {
        // Test the critical fromStopId and toStopId filters
        UUID fromStopId = UUID.randomUUID();
        UUID toStopId = UUID.randomUUID();

        PassengerPaginatedResponse<PassengerTripResponse> mockResponse = 
                PassengerPaginatedResponse.<PassengerTripResponse>builder()
                        .content(createSampleTripResponses())
                        .currentPage(0)
                        .size(20)
                        .totalElements(1L)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build();

        when(passengerTripService.searchTrips(
                eq(fromStopId), eq(toStopId), eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null),
                eq(null), eq(null), eq(null), any(Pageable.class)
        )).thenReturn(mockResponse);

        mockMvc.perform(get("/api/passenger/trips/search")
                        .param("fromStopId", fromStopId.toString())
                        .param("toStopId", toStopId.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(passengerTripService).searchTrips(
                fromStopId, toStopId, null, null, null,
                null, null, null,
                null, null, null,
                null, null, null, PageRequest.of(0, 20)
        );
    }

    private List<PassengerTripResponse> createSampleTripResponses() {
        List<PassengerTripResponse> trips = new ArrayList<>();
        
        trips.add(PassengerTripResponse.builder()
                .tripId(UUID.randomUUID())
                .routeName("Colombo - Kandy Express")
                .scheduledDeparture(LocalDate.of(2025, 10, 19).atTime(8, 30))
                .scheduledArrival(LocalDate.of(2025, 10, 19).atTime(12, 30))
                .estimatedDeparture(LocalDate.of(2025, 10, 19).atTime(8, 32))
                .estimatedArrival(LocalDate.of(2025, 10, 19).atTime(12, 35))
                .duration(240)
                .distance(115.5)
                .status("active")
                .delay(2)
                .fare(450.0)
                .availableSeats(12)
                .bookingAvailable(true)
                .build());
        
        trips.add(PassengerTripResponse.builder()
                .tripId(UUID.randomUUID())
                .routeName("Galle - Matara Local")
                .scheduledDeparture(LocalDate.of(2025, 10, 19).atTime(9, 15))
                .scheduledArrival(LocalDate.of(2025, 10, 19).atTime(10, 45))
                .estimatedDeparture(LocalDate.of(2025, 10, 19).atTime(9, 15))
                .estimatedArrival(LocalDate.of(2025, 10, 19).atTime(10, 45))
                .duration(90)
                .distance(42.0)
                .status("in_transit")
                .delay(0)
                .fare(125.0)
                .availableSeats(8)
                .bookingAvailable(true)
                .build());
        
        return trips;
    }
}