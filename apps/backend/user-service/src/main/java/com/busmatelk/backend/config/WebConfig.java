package com.busmatelk.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns(
                                "http://localhost:3000",
                                "http://localhost:3001",
                                "http://localhost:4000",
                                "https://busmate-web-frontend.vercel.app",
                                "https://*.vercel.app",
                                "https://*.netlify.app",
                                "https://*.amazonaws.com",
                                "https://*.elasticbeanstalk.com")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                        .allowedHeaders(
                                "Origin",
                                "Content-Type",
                                "Accept",
                                "Authorization",
                                "Access-Control-Request-Method",
                                "Access-Control-Request-Headers",
                                "X-Requested-With",
                                "Cache-Control")
                        .exposedHeaders(
                                "Access-Control-Allow-Origin",
                                "Access-Control-Allow-Credentials")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}
