package com.busmatelk.backend.service.impl;

import com.busmatelk.backend.dto.FinanceOfficerDTO;
import com.busmatelk.backend.model.FinanceOfficer;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.FinanceOfficerRepo;
import com.busmatelk.backend.repository.UserRepo;
import com.busmatelk.backend.service.FinanceOfficerService;
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
import java.util.UUID;

@Service
public class FinanceOfficerServiceIMPL implements FinanceOfficerService {


    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @Value("${supabase.api.key}")
    private String SUPABASE_API_KEY;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private FinanceOfficerRepo FinanceOfficerRepo;

    @Override
    @Transactional
    public void createFinanceOfficer(FinanceOfficerDTO financeOfficerDTO) {

        try {
            // Step 1: Call Supabase Auth API to register user
            HttpClient client = HttpClient.newHttpClient();

            String requestBody = String.format("""
                {
                    "email": "%s",
                    "password": "%s"
                }
            """, financeOfficerDTO.getEmail(), financeOfficerDTO.getPassword());

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
                "user_role": "Finance_Officer"
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
            // Step 3: Create FinanceOfficer record in the database
            User user = new User();
            user.setUserId(userId);
            user.setFullName(financeOfficerDTO.getFullName());
            user.setUsername(financeOfficerDTO.getUsername());
            user.setEmail(financeOfficerDTO.getEmail());
            user.setRole("Finance_Officer");
            user.setAccountStatus("Active");
            user.setIsVerified(true);
            user.setPhoneNumber(financeOfficerDTO.getPhoneNumber());

            // Assuming you have a UserRepository to save the user
            user = userRepo.save(user);
            // Step 4: Create FinanceOfficer record
            FinanceOfficer financeOfficer = new FinanceOfficer();
            financeOfficer.setEmp_id(financeOfficerDTO.getEmp_id());
            financeOfficer.setUser(user);
            // Assuming you have a FinanceOfficerRepository to save the finance officer

            // Save the FinanceOfficer record
            FinanceOfficerRepo.save(financeOfficer);
        } catch (Exception e) {
            throw new RuntimeException(e);
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

}
