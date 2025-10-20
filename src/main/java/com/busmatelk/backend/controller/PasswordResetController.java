package com.busmatelk.backend.controller;
import com.busmatelk.backend.dto.request.ResetPasswdDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @PostMapping("/reset-password")
    public String sendResetEmail(@RequestBody ResetPasswdDTO resetPasswdDTO) {

        String email = resetPasswdDTO.getEmail();

    if (email == null || email.isEmpty()) {
            return "Email cannot be empty";
        }

        System.out.println("modaya");
    try {
        String supabaseUrl = "https://gvxbzcxjueghvrtsfdxc.supabase.co";
        String apiKey = supabaseAnonKey;

        String jsonBody = String.format("{\"email\": \"%s\"}", email);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + "/auth/v1/recover"))
                .header("apikey", apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpClient client = HttpClient.newHttpClient();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("Status Code: " + response.statusCode());
        System.out.println("Response Body: " + response.body());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to send reset email: " + response.body());
        }

        return "Reset email sent successfully";
    } catch (Exception e) {
        throw new RuntimeException("Failed to send reset email: " + e.getMessage());
    }
    }
}
