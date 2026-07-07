package com.busmatelk.backend.service.impl;

import com.busmatelk.backend.dto.PassengerDTO;
import com.busmatelk.backend.dto.request.PassengerUpdateDTO;
import com.busmatelk.backend.model.Passenger;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.PassengerRepo;
import com.busmatelk.backend.repository.UserRepo;
import com.busmatelk.backend.service.PassengerService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Optional;
import java.util.UUID;

@Service
public class PassengerServiceIMPL implements PassengerService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PassengerRepo passengerRepo;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @Value("${supabase.api.key}")
    private String supabaseServiceRoleKey;

    @Override
    @Transactional
    public void createPassenger(PassengerDTO passengerDTO) {
        try {
            // Step 1: Register user with Supabase Auth API
            HttpClient client = HttpClient.newHttpClient();

            String requestBody = String.format("""
                    {
                        "email": "%s",
                        "password": "%s"
                    }
                """, passengerDTO.getEmail(), passengerDTO.getPassword());

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

            // Step 2.1: Add user role to Supabase metadata
            HttpRequest metadataRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://gvxbzcxjueghvrtsfdxc.supabase.co/auth/v1/admin/users/" + userIdString))
                    .header("Content-Type", "application/json")
                    .header("apikey", supabaseServiceRoleKey)
                    .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                    .PUT(HttpRequest.BodyPublishers.ofString("""
            {
              "user_metadata": {
                "user_role": "Passenger"
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

            UUID userId = UUID.fromString(userIdString);

            // Step 3: Map to User entity
            User user = new User();
            user.setUserId(userId);
            user.setFullName(passengerDTO.getFullName());
            user.setUsername(passengerDTO.getUsername());
            user.setEmail(passengerDTO.getEmail());
            user.setRole("Passenger");
            user.setAccountStatus(passengerDTO.getAccountStatus());
            user.setIsVerified(passengerDTO.getIsVerified());
            user.setCreatedAt(Instant.now());

            user = userRepo.save(user); // ✅ Persisting User

// ✅ Step 4: Use the same User object

            Passenger passenger = new Passenger();
            passenger.setUser(user);
            passenger.setNotification_preferences(passengerDTO.getNotification_preferences());

            passengerRepo.save(passenger);
            System.out.println(userId);


        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Passenger creation failed: " + e.getMessage(), e);
        }
    }


    @Override
    public PassengerDTO getPassengerById(UUID userId) {

        User user = userRepo.findById(userId).get();

        PassengerDTO passengerDTO = new PassengerDTO();
        passengerDTO.setUserId(user.getUserId());
        passengerDTO.setFullName(user.getFullName());
        passengerDTO.setUsername(user.getUsername());
        passengerDTO.setEmail(user.getEmail());
        passengerDTO.setRole(user.getRole());
        passengerDTO.setAccountStatus(user.getAccountStatus());
        passengerDTO.setIsVerified(user.getIsVerified());


//        passengerDTO.setNotification_preferences(passenger.getNotification_preferences());

        return passengerDTO;

    }

    @Override
    @Transactional
    public PassengerDTO updatePassenger(UUID userId, PassengerUpdateDTO updateDTO) {
        // Find the user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Find the passenger
        Passenger passenger = passengerRepo.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Passenger not found with user ID: " + userId));

        // Update user fields (only allowed fields)
        if (updateDTO.getFullName() != null && !updateDTO.getFullName().trim().isEmpty()) {
            user.setFullName(updateDTO.getFullName());
        }
        if (updateDTO.getPhoneNumber() != null) {
            user.setPhoneNumber(updateDTO.getPhoneNumber());
        }
        if (updateDTO.getUsername() != null && !updateDTO.getUsername().trim().isEmpty()) {
            user.setUsername(updateDTO.getUsername());
        }

        // Update passenger fields
        if (updateDTO.getNotification_preferences() != null) {
            passenger.setNotification_preferences(updateDTO.getNotification_preferences());
        }

        // Save changes
        user = userRepo.save(user);
        passenger = passengerRepo.save(passenger);

        // Return updated passenger DTO
        PassengerDTO passengerDTO = new PassengerDTO();
        passengerDTO.setUserId(user.getUserId());
        passengerDTO.setFullName(user.getFullName());
        passengerDTO.setUsername(user.getUsername());
        passengerDTO.setEmail(user.getEmail());
        passengerDTO.setRole(user.getRole());
        passengerDTO.setAccountStatus(user.getAccountStatus());
        passengerDTO.setIsVerified(user.getIsVerified());
        passengerDTO.setNotification_preferences(passenger.getNotification_preferences());

        return passengerDTO;
    }

    @Override
    public List<PassengerDTO> getAllPassengers() {
        // Get all users with role "Passenger"
        List<User> passengerUsers = userRepo.findByRole("Passenger");

        List<PassengerDTO> passengerDTOs = new ArrayList<>();

        for (User user : passengerUsers) {
            // Find the passenger profile for each user
            Optional<Passenger> passengerOpt = passengerRepo.findByUserUserId(user.getUserId());

            PassengerDTO passengerDTO = new PassengerDTO();
            passengerDTO.setUserId(user.getUserId());
            passengerDTO.setFullName(user.getFullName());
            passengerDTO.setUsername(user.getUsername());
            passengerDTO.setEmail(user.getEmail());
            passengerDTO.setRole(user.getRole());
            passengerDTO.setAccountStatus(user.getAccountStatus());
            passengerDTO.setIsVerified(user.getIsVerified());

            // Set notification preferences if passenger profile exists
            if (passengerOpt.isPresent()) {
                passengerDTO.setNotification_preferences(passengerOpt.get().getNotification_preferences());
            }

            passengerDTOs.add(passengerDTO);
        }

        return passengerDTOs;
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
}
