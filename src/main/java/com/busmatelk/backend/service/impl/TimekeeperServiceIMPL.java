package com.busmatelk.backend.service.impl;

import com.busmatelk.backend.dto.TimekeeperDTO;
import com.busmatelk.backend.service.TimekeeperService;
import com.busmatelk.backend.model.Timekeeper;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.TimekeeperRepo;
import com.busmatelk.backend.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class TimekeeperServiceIMPL implements TimekeeperService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private TimekeeperRepo timekeeperRepo;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @Value("${supabase.api.key}")
    private String SUPABASE_API_KEY;

    @Override
    @Transactional
    public void createtimekeeper(TimekeeperDTO signupDTO) {
        try {
            // Step 1: Register user with Supabase Auth
            HttpClient client = HttpClient.newHttpClient();
            String requestBody = String.format("""
                        {
                            "email": "%s",
                            "password": "%s"
                        }
                    """, signupDTO.getEmail(), signupDTO.getPassword());

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
                    .header("apikey", SUPABASE_API_KEY)
                    .header("Authorization", "Bearer " + SUPABASE_API_KEY)
                    .PUT(HttpRequest.BodyPublishers.ofString("""
                                {
                                  "user_metadata": {
                                    "user_role": "Timekeeper"
                                  }
                                }
                            """))
                    .build();

            HttpResponse<String> metadataResponse = client.send(metadataRequest, HttpResponse.BodyHandlers.ofString());
            System.out.println("Metadata response code: " + metadataResponse.statusCode());
            System.out.println("Metadata response body: " + metadataResponse.body());

            if (metadataResponse.statusCode() != 200) {
                throw new RuntimeException("Failed to update user metadata: " + metadataResponse.body());
            }

            // Step 3: Save to User table
            User user = new User();
            user.setUserId(userId);
            user.setFullName(signupDTO.getFullname());
            user.setEmail(signupDTO.getEmail());
            user.setRole("Timekeeper");
            user.setCreatedAt(Instant.now());
            user.setPhoneNumber(signupDTO.getPhonenumber());
            user.setIsVerified(false);
            user.setAccountStatus("ACTIVE");
            user = userRepo.save(user);

            // Step 4: Save to Timekeeper table
            Timekeeper timekeeper = new Timekeeper();
            timekeeper.setUser(user);
            timekeeper.setAssignStand(signupDTO.getAssign_stand());
            timekeeper.setNic(signupDTO.getNic());
            timekeeper.setProvince(signupDTO.getProvince());
            timekeeperRepo.save(timekeeper);

        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to create timekeeper: " + e.getMessage(), e);
        }
    }

    private String extractUserIdFromJson(String json) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(json);
        if (root.has("id")) {
            return root.get("id").asText();
        } else if (root.has("user") && root.get("user").has("id")) {
            return root.get("user").get("id").asText();
        } else {
            throw new RuntimeException("Unexpected Supabase response: " + json);
        }
    }

    @Override
    public TimekeeperDTO getTimekeeperById(UUID userId) {
        // Find the user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Find the timekeeper
        Timekeeper timekeeper = timekeeperRepo.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Timekeeper not found with user ID: " + userId));

        // Map to DTO
        TimekeeperDTO timekeeperDTO = new TimekeeperDTO();
        timekeeperDTO.setFullname(user.getFullName());
        timekeeperDTO.setEmail(user.getEmail());
        timekeeperDTO.setPhonenumber(user.getPhoneNumber());
        timekeeperDTO.setAssign_stand(timekeeper.getAssignStand());
        timekeeperDTO.setNic(timekeeper.getNic());
        timekeeperDTO.setProvince(timekeeper.getProvince());

        return timekeeperDTO;
    }

    @Override
    public List<TimekeeperDTO> getAllTimekeepers() {
        // Get all timekeepers from the repository
        List<Timekeeper> timekeepers = timekeeperRepo.findAll();

        List<TimekeeperDTO> timekeeperDTOs = new ArrayList<>();

        for (Timekeeper timekeeper : timekeepers) {
            User user = timekeeper.getUser();

            // Map to DTO
            TimekeeperDTO timekeeperDTO = new TimekeeperDTO();
            timekeeperDTO.setId(timekeeper.getId());
            timekeeperDTO.setFullname(user.getFullName());
            timekeeperDTO.setEmail(user.getEmail());
            timekeeperDTO.setPhonenumber(user.getPhoneNumber());
            timekeeperDTO.setAssign_stand(timekeeper.getAssignStand());
            timekeeperDTO.setNic(timekeeper.getNic());
            timekeeperDTO.setProvince(timekeeper.getProvince());

            timekeeperDTOs.add(timekeeperDTO);
        }

        return timekeeperDTOs;
    }
}
