package com.busmatelk.backend.controller;

import com.busmatelk.backend.client.SupabaseAuthClient;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import com.busmatelk.backend.service.CredentialService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies GET /public/jwks.json doesn't just have the right shape, but publishes the *actual*
 * key TokenService signs with — i.e. a client that only ever talks to this endpoint (the way the
 * API gateway and management portal do) can independently verify a real, freshly-issued token.
 */
@SpringBootTest
@AutoConfigureMockMvc
class JwksControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTypeRepository userTypeRepository;

    @Autowired
    private CredentialService credentialService;

    @MockitoBean
    private SupabaseAuthClient supabaseAuthClient;

    @Test
    void publishesTheKeyThatSignsRealAccessTokens() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("jwks-check@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Sup3rSecret!");

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "jwks-check@example.com", "password", "Sup3rSecret!"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(loginResponse).get("accessToken").asText();

        String jwksResponse = mockMvc.perform(get("/public/jwks.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.keys[0].kty").value("RSA"))
                .andExpect(jsonPath("$.keys[0].alg").value("RS256"))
                .andExpect(jsonPath("$.keys[0].kid").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        JsonNode jwk = objectMapper.readTree(jwksResponse).get("keys").get(0);
        RSAPublicKey publicKey = reconstructPublicKey(jwk.get("n").asText(), jwk.get("e").asText());

        // No exception == the signature verifies against the key this endpoint just published.
        Jwts.parserBuilder().setSigningKey(publicKey).build().parseClaimsJws(accessToken);

        String kidHeader = objectMapper.readTree(
                        Base64.getUrlDecoder().decode(padBase64Url(accessToken.split("\\.")[0])))
                .get("kid").asText();
        assertThat(kidHeader).isEqualTo(jwk.get("kid").asText());
    }

    private static RSAPublicKey reconstructPublicKey(String nBase64Url, String eBase64Url) throws Exception {
        BigInteger n = new BigInteger(1, Base64.getUrlDecoder().decode(nBase64Url));
        BigInteger e = new BigInteger(1, Base64.getUrlDecoder().decode(eBase64Url));
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(n, e));
    }

    private static String padBase64Url(String segment) {
        int padding = (4 - segment.length() % 4) % 4;
        return segment + "=".repeat(padding);
    }
}
