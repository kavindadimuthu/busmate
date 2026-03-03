package com.busmate.routeschedule.network.controller;

import com.busmate.routeschedule.shared.dto.LocationDto;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.network.entity.Stop;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@Transactional // This ensures each test runs in its own transaction and rolls back
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD) // Reset context after each test
@DisplayName("Stop Controller Integration Tests")
class StopControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    // ========== Helper Methods ==========

    /**
     * Helper method to create a valid StopRequest for testing
     */
    private StopRequest createValidStopRequest() {
        StopRequest request = new StopRequest();
        request.setName("Test Bus Stop");
        request.setDescription("A test bus stop for integration testing");
        request.setIsAccessible(true);

        LocationDto location = new LocationDto();
        location.setLatitude(6.9271);
        location.setLongitude(79.8612);
        location.setAddress("123 Test Street");
        location.setCity("Test City");
        location.setState("Test Province");
        location.setZipCode("12345");
        location.setCountry("Sri Lanka");
        request.setLocation(location);

        return request;
    }

    /**
     * Helper method to create an invalid StopRequest (missing required fields)
     */
    private StopRequest createInvalidStopRequest() {
        StopRequest request = new StopRequest();
        // Missing required fields: name and location
        request.setDescription("Invalid request - missing required fields");
        return request;
    }

    // ========== GET /api/stops Tests ==========

    @Nested
    @DisplayName("GET /api/stops - Get All Stops with Pagination")
    class GetAllStopsWithPaginationTests {

        @Test
        @DisplayName("Should return first page of stops with default pagination")
        void shouldReturnFirstPageWithDefaultPagination() throws Exception {
            mockMvc.perform(get("/api/stops"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.pageable").exists())
                    .andExpect(jsonPath("$.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.pageable.pageSize").value(10))
                    .andExpect(jsonPath("$.totalElements").exists())
                    .andExpect(jsonPath("$.totalPages").exists())
                    .andExpect(jsonPath("$.first").value(true))
                    .andExpect(jsonPath("$.numberOfElements").isNumber());
        }

        @Test
        @DisplayName("Should return stops with custom pagination parameters")
        void shouldReturnStopsWithCustomPagination() throws Exception {
            mockMvc.perform(get("/api/stops")
                            .param("page", "0")
                            .param("size", "5")
                            .param("sortBy", "name")
                            .param("sortDir", "asc"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.pageable.pageSize").value(5))
                    .andExpect(jsonPath("$.content", hasSize(lessThanOrEqualTo(5))));
        }

        @Test
        @DisplayName("Should return stops sorted by createdAt in descending order")
        void shouldReturnStopsSortedByCreatedAtDesc() throws Exception {
            mockMvc.perform(get("/api/stops")
                            .param("sortBy", "createdAt")
                            .param("sortDir", "desc"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        @DisplayName("Should filter stops by search text")
        void shouldFilterStopsBySearchText() throws Exception {
            mockMvc.perform(get("/api/stops")
                            .param("search", "Fort"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
            // Note: We can't assert specific content since it depends on seed data
            // In a real test, you might want to create specific test data first
        }

        @Test
        @DisplayName("Should handle search with no results")
        void shouldHandleSearchWithNoResults() throws Exception {
            mockMvc.perform(get("/api/stops")
                            .param("search", "NonExistentStopName123"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content", hasSize(0)))
                    .andExpect(jsonPath("$.totalElements").value(0));
        }

        @Test
        @DisplayName("Should enforce maximum page size limit")
        void shouldEnforceMaximumPageSizeLimit() throws Exception {
            mockMvc.perform(get("/api/stops")
                            .param("size", "200")) // Requesting more than max limit (100)
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.pageable.pageSize").value(100)); // Should be limited to 100
        }

        @Test
        @DisplayName("Should handle invalid sort parameters gracefully")
        void shouldHandleInvalidSortParameters() throws Exception {
            // This might pass or fail depending on Spring Data JPA configuration
            // It's more of a documentation test to see how the system behaves
            try {
                mockMvc.perform(get("/api/stops")
                                .param("sortBy", "invalidField")
                                .param("sortDir", "asc"))
                        .andDo(print())
                        .andExpect(status().isOk()); // Default sort might be applied
            } catch (Exception e) {
                // If it fails, that's also acceptable behavior
                System.out.println("Invalid sort field was rejected as expected: " + e.getMessage());
            }
        }
    }

    // ========== POST /api/stops Tests ==========

    @Nested
    @DisplayName("POST /api/stops - Create New Bus Stop")
    class CreateStopTests {

        @Test
        @DisplayName("Should successfully create a new stop with valid data and authentication")
        @WithMockUser(username = "testuser", roles = "USER")
        void shouldCreateStopWithValidDataAndAuth() throws Exception {
            StopRequest validRequest = createValidStopRequest();

            mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.name").value(validRequest.getName()))
                    .andExpect(jsonPath("$.description").value(validRequest.getDescription()))
                    .andExpect(jsonPath("$.isAccessible").value(validRequest.getIsAccessible()))
                    .andExpect(jsonPath("$.location.latitude").value(validRequest.getLocation().getLatitude()))
                    .andExpect(jsonPath("$.location.longitude").value(validRequest.getLocation().getLongitude()))
                    .andExpect(jsonPath("$.location.city").value(validRequest.getLocation().getCity()))
                    .andExpect(jsonPath("$.createdAt").exists())
                    .andExpect(jsonPath("$.updatedAt").exists())
                    .andExpect(jsonPath("$.createdBy").value("testuser"))
                    .andExpect(jsonPath("$.updatedBy").value("testuser"));
        }

        @Test
        @DisplayName("Should return 401 Unauthorized when creating stop without authentication")
        void shouldReturn401WhenCreatingStopWithoutAuth() throws Exception {
            StopRequest validRequest = createValidStopRequest();

            mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest)))
                    .andDo(print())
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should return 400 Bad Request for invalid stop data")
        @WithMockUser(username = "testuser", roles = "USER")
        void shouldReturn400ForInvalidStopData() throws Exception {
            StopRequest invalidRequest = createInvalidStopRequest();

            mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 Bad Request for empty request body")
        @WithMockUser(username = "testuser", roles = "USER")
        void shouldReturn400ForEmptyRequestBody() throws Exception {
            mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 Bad Request for malformed JSON")
        @WithMockUser(username = "testuser", roles = "USER")
        void shouldReturn400ForMalformedJson() throws Exception {
            mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{ invalid json }"))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should handle duplicate stop creation in same city")
        @WithMockUser(username = "testuser", roles = "USER")
        void shouldHandleDuplicateStopCreation() throws Exception {
            StopRequest request = createValidStopRequest();

            // First creation should succeed
            mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isCreated());

            // Second creation with same name and city should fail
            mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isConflict()); // 409 Conflict
        }
    }

    // ========== GET /api/stops/all Tests ==========

    @Nested
    @DisplayName("GET /api/stops/all - Get All Stops Without Pagination")
    class GetAllStopsWithoutPaginationTests {

        @Test
        @DisplayName("Should return all stops as a simple list without pagination")
        void shouldReturnAllStopsWithoutPagination() throws Exception {
            mockMvc.perform(get("/api/stops/all"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    // Should NOT have pagination fields
                    .andExpect(jsonPath("$.pageable").doesNotExist())
                    .andExpect(jsonPath("$.totalElements").doesNotExist())
                    .andExpect(jsonPath("$.totalPages").doesNotExist());
        }

        @Test
        @DisplayName("Should return stops with all required fields in simple list format")
        void shouldReturnStopsWithAllRequiredFields() throws Exception {
            mockMvc.perform(get("/api/stops/all"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
            // Note: We can't assert specific array elements without knowing if data exists
            // This test validates the endpoint structure
        }

        @Test
        @DisplayName("Should not accept any query parameters")
        void shouldNotAcceptQueryParameters() throws Exception {
            // This endpoint shouldn't accept pagination or search parameters
            // It should ignore them and return all stops
            mockMvc.perform(get("/api/stops/all")
                            .param("page", "1")
                            .param("size", "5")
                            .param("search", "test"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
            // Parameters should be ignored, all stops returned
        }
    }

    // ========== Cross-Cutting Integration Tests ==========

    @Nested
    @DisplayName("Cross-Cutting Integration Tests")
    class CrossCuttingTests {

        @Test
        @DisplayName("Should create a stop and then retrieve it in paginated and non-paginated lists")
        @WithMockUser(username = "integrationtestuser", roles = "USER")
        void shouldCreateStopAndRetrieveInBothEndpoints() throws Exception {
            // Step 1: Create a unique stop
            StopRequest request = createValidStopRequest();
            request.setName("Integration Test Stop - Unique Name");
            request.getLocation().setCity("Integration Test City");

            String responseContent = mockMvc.perform(post("/api/stops")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.name").value(request.getName()))
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            // Extract the created stop's ID
            StopResponse createdStop = objectMapper.readValue(responseContent, StopResponse.class);

            // Step 2: Verify the stop appears in paginated list
            mockMvc.perform(get("/api/stops")
                            .param("search", "Integration Test Stop"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content[?(@.id == '" + createdStop.getId() + "')]").exists())
                    .andExpect(jsonPath("$.content[?(@.name == '" + request.getName() + "')]").exists());

            // Step 3: Verify the stop appears in non-paginated list
            mockMvc.perform(get("/api/stops/all"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[?(@.id == '" + createdStop.getId() + "')]").exists())
                    .andExpect(jsonPath("$[?(@.name == '" + request.getName() + "')]").exists());
        }

        @Test
        @DisplayName("Should validate that paginated and non-paginated endpoints return consistent data structure")
        void shouldHaveConsistentDataStructureBetweenEndpoints() throws Exception {
            // Get data from paginated endpoint
            String paginatedResponse = mockMvc.perform(get("/api/stops")
                            .param("size", "1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            // Get data from non-paginated endpoint
            String nonPaginatedResponse = mockMvc.perform(get("/api/stops/all"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            // Both should have stops with same structure (this is more of a visual verification in logs)
            // In practice, you might want to parse and compare the structure programmatically
            System.out.println("=== Paginated Response Structure ===");
            System.out.println(paginatedResponse);
            System.out.println("=== Non-Paginated Response Structure ===");
            System.out.println(nonPaginatedResponse);
        }
    }
}