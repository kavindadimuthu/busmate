package com.busmatelk.backend.service.impl;

import com.busmatelk.backend.dto.fleetOperatorDTO;
import com.busmatelk.backend.model.Conductor;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.fleetOperatorModel;
import com.busmatelk.backend.repository.UserRepo;
import com.busmatelk.backend.repository.fleetOperatorRepo;
import com.busmatelk.backend.service.fleetOperatorProfileService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.UUID;

@Service
public class fleetOperatorServiceIMPL implements fleetOperatorProfileService {

    @Autowired
    private fleetOperatorRepo fleetOperatorRepo;

    @Autowired
    private UserRepo userRepo;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @Value("${supabase.api.key}")
    private String supabaseServiceRoleKey;

    @Override
    @Transactional
    public void addfleetOperatorProfile( fleetOperatorDTO fleetOperatorDTO) {

//        System.out.println(fleetOperatorDTO.getFullName());

            // Step 1: Call Supabase Auth API to register user
        try {
            HttpClient client = HttpClient.newHttpClient();

            String requestBody = String.format("""
                        {
                            "email": "%s",
                            "password": "%s"
                        }
                    """, fleetOperatorDTO.getEmail(), fleetOperatorDTO.getPassword());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://gvxbzcxjueghvrtsfdxc.supabase.co/auth/v1/signup"))
                    .header("Content-Type", "application/json")
                    .header("apikey", supabaseAnonKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200 && response.statusCode() != 201) {
                throw new RuntimeException("Supabase signup failed: " + response.body());
            }


            // Step 2: Extract userId from response JSON
            String responseBody = response.body();
            String userIdString = extractUserIdFromJson(responseBody);
            UUID userId = UUID.fromString(userIdString);

            // Step 2.1: Add user role to Supabase metadata
            HttpRequest metadataRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://gvxbzcxjueghvrtsfdxc.supabase.co/auth/v1/admin/users/" + userIdString))
                    .header("Content-Type", "application/json")
                    .header("apikey", supabaseServiceRoleKey)
                    .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                    .PUT(HttpRequest.BodyPublishers.ofString("""
            {
              "user_metadata": {
                "user_role": "FleetOperator"
              }
            }
        """))
                    .build();

            HttpResponse<String> metadataResponse = client.send(metadataRequest, HttpResponse.BodyHandlers.ofString());
//            System.out.println("Metadata response code: " + metadataResponse.statusCode());
//            System.out.println("Metadata response body: " + metadataResponse.body());

            if (metadataResponse.statusCode() != 200) {
                throw new RuntimeException("Failed to update user metadata: " + metadataResponse.body());
            }


            // Map to User
            User user = new User();

            user.setUserId(userId);
            user.setFullName(fleetOperatorDTO.getFullName());
            user.setUsername(fleetOperatorDTO.getUsername());
            user.setEmail(fleetOperatorDTO.getEmail());
            user.setRole("FleetOperator");
            user.setAccountStatus(fleetOperatorDTO.getAccountStatus());
            user.setIsVerified(fleetOperatorDTO.getIsVerified());
            user.setCreatedAt(Instant.now());

            user = userRepo.save(user);

            // Map to FleetOperatorProfile
            fleetOperatorModel profile = new fleetOperatorModel();
            profile.setOperatorType(fleetOperatorDTO.getOperatorType());
            profile.setOrganizationName(fleetOperatorDTO.getOrganizationName());
            profile.setRegion(fleetOperatorDTO.getRegion());
            profile.setRegistrationId(fleetOperatorDTO.getRegistrationId());
//        profile.setContactDetails(fleetOperatorDTO.getContactDetails());
            profile.setUser(user); // saving the relationship

            fleetOperatorRepo.save(profile);


        }catch (Exception e){
//            e.printStackTrace();
            throw new RuntimeException("Supabase signup failed: " + e);

            }
    }
    private String extractUserIdFromJson(String json) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(json);

        if (root.has("id")) {
            return root.get("id").asText();  // ✅ user ID is at root
        } else if (root.has("user") && root.get("user").has("id")) {
            // fallback in case Supabase returns "user" wrapping
            return root.get("user").get("id").asText();
        } else {
            throw new RuntimeException("Unexpected Supabase response: " + json);
        }
    }

    @Override
    public fleetOperatorDTO getFleetoperatorById(UUID userId) {
        // Validate input
        if (userId == null) {
            throw new IllegalArgumentException("User ID must not be null");
        }

        // Fetch user by userId
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found for id: " + userId));

        // Fetch fleet operator profile by user
        fleetOperatorModel profile = fleetOperatorRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Fleet operator profile not found for user id: " + userId));

        // Map to DTO
        fleetOperatorDTO dto = new fleetOperatorDTO();
        dto.setUserId(user.getUserId());
        dto.setFullName(user.getFullName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());  // Added phoneNumber
        dto.setAccountStatus(user.getAccountStatus());
        dto.setIsVerified(user.getIsVerified());
        dto.setOperatorType(profile.getOperatorType());
        dto.setOrganizationName(profile.getOrganizationName());
        dto.setRegion(profile.getRegion());
        dto.setRegistrationId(profile.getRegistrationId());

        return dto;
    }

    @Override
    @Transactional
    public void updateFleetOperatorProfile(UUID userId, fleetOperatorDTO fleetOperatorDTO, MultipartFile file) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID must not be null");
        }

        // Fetch existing user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found for id: " + userId));

        // Fetch existing fleet operator profile
        fleetOperatorModel profile = fleetOperatorRepo.findByUser(user)
                .orElseThrow(() -> new EntityNotFoundException("Fleet operator profile not found for user id: " + userId));

        // Update only the specified fields in User entity
        if (fleetOperatorDTO.getFullName() != null) {
            user.setFullName(fleetOperatorDTO.getFullName());
        }
        if (fleetOperatorDTO.getPhoneNumber() != null) {
            user.setPhoneNumber(fleetOperatorDTO.getPhoneNumber());
        }
        user.setUpdatedAt(Instant.now());
        userRepo.save(user);

        // Update only the specified fields in FleetOperator profile
        if (fleetOperatorDTO.getOperatorType() != null) {
            profile.setOperatorType(fleetOperatorDTO.getOperatorType());
        }
        if (fleetOperatorDTO.getOrganizationName() != null) {
            profile.setOrganizationName(fleetOperatorDTO.getOrganizationName());
        }

        fleetOperatorRepo.save(profile);
    }

    @Override
    public void deleteFleetOperator(UUID userId) {

        // Find the user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Find the fleetoperator linked to the user
        fleetOperatorModel fleetoperator = fleetOperatorRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Conductor not found for user ID: " + userId));

        // Delete the conductor
        fleetOperatorRepo.delete(fleetoperator);

        // Set account status to deactivate
        user.setAccountStatus("deactivate");
        userRepo.save(user);
    }
}
