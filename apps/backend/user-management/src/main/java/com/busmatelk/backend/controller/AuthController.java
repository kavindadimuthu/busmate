package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.request.LoginRequestDTO;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @Autowired
    private UserRepo userRepo;


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        RestTemplate restTemplate = new RestTemplate();

        String supabaseUrl = "https://gvxbzcxjueghvrtsfdxc.supabase.co/auth/v1/token?grant_type=password";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseAnonKey);

        Map<String, String> payload = Map.of(
                "email", request.getEmail(),
                "password", request.getPassword()
        );

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

        try {
            // 1. Authenticate with Supabase
            ResponseEntity<Map> response = restTemplate.postForEntity(supabaseUrl, entity, Map.class);

            Map<String, Object> responseBody = new HashMap<>(response.getBody());

            // 2. Extract user email from Supabase response
            Map<String, Object> userMap = (Map<String, Object>) responseBody.get("user");
            String email = (String) userMap.get("email");
            System.out.println(email);


            // 3. Fetch role from your local DB
            Optional<User> dbUser = userRepo.findByEmail(email);
            System.out.println(dbUser.isPresent());
            if (dbUser.isPresent()) {
                String role = dbUser.get().getRole();
                System.out.println(role);

                // 4. Inject app_role into the user section of response
                userMap.put("app_role", role);
                responseBody.put("user", userMap);

                return ResponseEntity.ok(responseBody);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not founds in local DB"));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Login failed", "message", e.getMessage()));
        }
    }

}
