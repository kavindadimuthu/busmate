package com.busmatelk.backend.service.impl;

import com.busmatelk.backend.dto.ConductorDTO;
import com.busmatelk.backend.model.Conductor;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.ConductorRepo;
import com.busmatelk.backend.repository.UserRepo;
import com.busmatelk.backend.service.ConductorService;
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
import java.util.UUID;

@Service
public class ConductorServiceIMPL implements ConductorService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ConductorRepo conductorRepo;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @Value("${supabase.api.key}")
    private String SUPABASE_API_KEY;

    @Override
    @Transactional
    public void createConductor(ConductorDTO conductorDTO) {

         try {

            // Step 1: Call Supabase Auth API to register user
            HttpClient client = HttpClient.newHttpClient();

            String requestBody = String.format("""
                {
                    "email": "%s",
                    "password": "%s"
                }
            """, conductorDTO.getEmail(), conductorDTO.getPassword());

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
                "user_role": "Conductor"
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


            // Step 4: Save to your users table
            User user = new User();
            user.setUserId(userId);
            user.setFullName(conductorDTO.getFullName());
            user.setUsername(conductorDTO.getUsername());
            user.setEmail(conductorDTO.getEmail());
            user.setRole("Conductor");
            user.setAccountStatus(conductorDTO.getAccountStatus());
            user.setIsVerified(conductorDTO.getIsVerified());
            user.setCreatedAt(Instant.now());
            user.setPhoneNumber(conductorDTO.getPhoneNumber());

            user = userRepo.save(user);

            // Step 5: Save to conductor_profile
            Conductor conductor = new Conductor();
            conductor.setEmployee_id(conductorDTO.getEmployee_id());
            conductor.setAssign_operator_id(conductorDTO.getAssign_operator_id());
            conductor.setShift_status(conductorDTO.getShift_status());
            conductor.setNicNumber(conductorDTO.getNicNumber());
            conductor.setDateofbirth(conductorDTO.getDateOfBirth());
//            conductor.setPr_img_path(conductor.getPr_img_path());
            conductor.setUser(user);


            conductorRepo.save(conductor);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create conductor: " + e.getMessage(), e);
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
    public ConductorDTO getconductorsById(UUID userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

//        Conductor conductor = conductorRepo.findById(user.getUserId());

        ConductorDTO conductorDTO = new ConductorDTO();

        conductorDTO.setUserId(user.getUserId());
        conductorDTO.setFullName(user.getFullName());
        conductorDTO.setUsername(user.getUsername());
        conductorDTO.setEmail(user.getEmail());
        conductorDTO.setRole(user.getRole());
        conductorDTO.setAccountStatus(user.getAccountStatus());
        conductorDTO.setIsVerified(user.getIsVerified());
        conductorDTO.setPhoneNumber(user.getPhoneNumber());

//        conductorDTO.setEmployee_id(conductor.getEmployee_id());
//        conductorDTO.setShift_status(conductor.getShift_status());
//        conductorDTO.setAssign_operator_id(conductor.getAssign_operator_id());

//        System.out.println(user);
        return conductorDTO;
    }

    @Override
    @Transactional
    public ConductorDTO updateconductor(ConductorDTO conductorDTO, UUID userId) {
        // Fetch user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Fetch existing conductor linked to the user
        Conductor conductor = conductorRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Conductor not found for user ID: " + userId));

        // Update User fields
        user.setPhoneNumber(conductorDTO.getPhoneNumber());
        user.setFullName(conductorDTO.getFullName());
        user.setAccountStatus(conductorDTO.getAccountStatus());
        User updatedUser = userRepo.save(user);

        // Update Conductor fields (only update if values are provided)
        if (conductorDTO.getShift_status() != null) {
            conductor.setShift_status(conductorDTO.getShift_status());
        }
        if (conductorDTO.getPr_img_path() != null) {
            conductor.setPr_img_path(conductorDTO.getPr_img_path());
        }
        if (conductorDTO.getNicNumber() != null) {
            conductor.setNicNumber(conductorDTO.getNicNumber());
        }
        if (conductorDTO.getEmployee_id() != null) {
            conductor.setEmployee_id(conductorDTO.getEmployee_id());
        }
        if (conductorDTO.getAssign_operator_id() != null) {
            conductor.setAssign_operator_id(conductorDTO.getAssign_operator_id());
        }
        if (conductorDTO.getDateOfBirth() != null) {
            conductor.setDateofbirth(conductorDTO.getDateOfBirth());
        }

        Conductor updatedConductor = conductorRepo.save(conductor);

        // Create response DTO
        ConductorDTO dto = new ConductorDTO();
        // From User entity
        dto.setUserId(updatedUser.getUserId());
        dto.setFullName(updatedUser.getFullName());
        dto.setUsername(updatedUser.getUsername());
        dto.setEmail(updatedUser.getEmail());
        dto.setRole(updatedUser.getRole());
        dto.setAccountStatus(updatedUser.getAccountStatus());
        dto.setIsVerified(updatedUser.getIsVerified());
        dto.setPhoneNumber(updatedUser.getPhoneNumber());

        // From Conductor entity
        dto.setEmployee_id(updatedConductor.getEmployee_id());
        dto.setAssign_operator_id(updatedConductor.getAssign_operator_id());
        dto.setShift_status(updatedConductor.getShift_status());
        dto.setPr_img_path(updatedConductor.getPr_img_path());
        dto.setNicNumber(updatedConductor.getNicNumber());
        dto.setDateOfBirth(updatedConductor.getDateofbirth());

        return dto;
    }

    @Override
    public List<ConductorDTO> getAllConductors() {
        List<Conductor> conductors = conductorRepo.findAll();
        List<ConductorDTO> conductorDTOs = new ArrayList<>();
        for (Conductor conductor : conductors) {
            User user = conductor.getUser();
            ConductorDTO dto = new ConductorDTO();

            // From User entity
            dto.setUserId(user.getUserId());
            dto.setFullName(user.getFullName());
            dto.setUsername(user.getUsername());
            dto.setEmail(user.getEmail());
            dto.setRole(user.getRole());
            dto.setAccountStatus(user.getAccountStatus());
            dto.setIsVerified(user.getIsVerified());
            dto.setPhoneNumber(user.getPhoneNumber());

            // From Conductor entity
            dto.setEmployee_id(conductor.getEmployee_id());
            dto.setAssign_operator_id(conductor.getAssign_operator_id());
            dto.setShift_status(conductor.getShift_status());
            dto.setPr_img_path(conductor.getPr_img_path());

            conductorDTOs.add(dto);
        }
        return conductorDTOs;
    }

    @Override
    public void deleteConductor(UUID userId) {

        // Find the user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Find the conductor linked to the user
        Conductor conductor = conductorRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Conductor not found for user ID: " + userId));

        // Delete the conductor
        conductorRepo.delete(conductor);

        // Set account status to deactivate
        user.setAccountStatus("deactivate");
        userRepo.save(user);
    }


}
