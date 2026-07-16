package com.busmatelk.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

/**
 * Password hashing for the in-house auth path.
 *
 * <p>New passwords are encoded as bcrypt and stored with a {@code {bcrypt}} prefix, which keeps
 * the door open to migrating the default to argon2 later without rehashing everyone at once
 * (DelegatingPasswordEncoder picks the algorithm per-hash from the prefix). Crucially,
 * {@code setDefaultPasswordEncoderForMatches} makes un-prefixed hashes verify as bcrypt too —
 * that's exactly the shape of the {@code encrypted_password} values imported from Supabase/GoTrue,
 * so migrated users log in with their existing password and no forced reset.
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        String defaultId = "bcrypt";
        Map<String, PasswordEncoder> encoders = Map.of("bcrypt", new BCryptPasswordEncoder());
        DelegatingPasswordEncoder encoder = new DelegatingPasswordEncoder(defaultId, encoders);
        encoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder());
        return encoder;
    }
}
