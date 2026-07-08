package com.busmate.routeschedule.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("BusMate Core Service API")
                        .version("1.0.0")
                        .description("API for managing routes, schedules, stops, permits, and related entities for NTC Planning Section. " +
                                "Use the Authorize button to enter a JWT token obtained from Asgardeo login."))
                .addServersItem(new Server().url("http://localhost:9010").description("Local core-service"))
                .addServersItem(new Server().url("http://localhost:8080").description("Local API gateway"))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token obtained from Asgardeo login")));
    }
}
