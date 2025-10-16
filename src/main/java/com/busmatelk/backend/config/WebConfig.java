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
                        .allowedOrigins(
                            "http://localhost:3000", 
                            "https://busmate-web-frontend.vercel.app"
                        ) // list each frontend separately
                        // .allowedOrigins("*") // Tempory CORS allowance for all URLs
                        .allowedMethods("*") // GET, POST, PUT, etc.
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
