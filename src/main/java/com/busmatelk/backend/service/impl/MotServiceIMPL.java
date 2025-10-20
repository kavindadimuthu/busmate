package com.busmatelk.backend.service.impl;

import com.busmatelk.backend.dto.MotDTO;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.UserRepo;
import com.busmatelk.backend.service.MotService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.UUID;

@Service
public class MotServiceIMPL implements MotService {

    @Autowired
    private UserRepo userRepo;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @Override
    public void createMotUser(MotDTO motDTO) {

        try {

            // Step 1: Register user with Supabase Auth API
            HttpClient client = HttpClient.newHttpClient();

            String requestBody = String.format("""
                    {
                        "email": "%s",
                        "password": "%s"
                    }
                """, motDTO.getEmail(), motDTO.getPassword());

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
//            System.out.println("Supabase response: " + responseBody); // Debugging

            String userIdString = extractUserIdFromJson(responseBody);
            if (userIdString == null || userIdString.isBlank()) {
                throw new RuntimeException("User ID missing in Supabase response");
            }

            UUID userId = UUID.fromString(userIdString);

            // Step 3: Map to User entity
            User user = new User();
            user.setUserId(userId);
            user.setFullName(motDTO.getFullName());
            user.setUsername(motDTO.getUsername());
            user.setEmail(motDTO.getEmail());
            user.setRole("Mot");
            user.setAccountStatus(motDTO.getAccountStatus());
            user.setIsVerified(motDTO.getIsVerified());
            user.setCreatedAt(Instant.now());

            userRepo.save(user);
            System.out.println("Creating MOT user: " + motDTO);
        } catch (Exception e) {
            // Handle exceptions appropriately, such as logging or rethrowing
            System.err.println("Error creating MOT user: " + e.getMessage());
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

    private MotDTO mapUserToMotDTO(User user) {
        MotDTO motDTO = new MotDTO();
        motDTO.setUserId(user.getUserId());
        motDTO.setFullName(user.getFullName());
        motDTO.setUsername(user.getUsername());
        motDTO.setEmail(user.getEmail());
        motDTO.setAccountStatus(user.getAccountStatus());
        motDTO.setIsVerified(user.getIsVerified());
        motDTO.setRole(user.getRole());
//        motDTO.set(user.getPhoneNumber());
        return motDTO;
    }

    @Override
    public MotDTO getMotById(String userId) {
        User user = userRepo.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
//        System.out.println(user);
        return mapUserToMotDTO(user);
    }

    @Override
    public MotDTO updateMotUser(String userId, String fullName, String phoneNumber) {
        User user = userRepo.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setFullName(fullName);
        user.setPhoneNumber(phoneNumber);
        userRepo.save(user);
        return mapUserToMotDTO(user);
    }
}
