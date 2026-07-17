package com.busmatelk.telemetry.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI telemetryServiceOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("BusMate Telemetry Service API")
                .description("Device registry, telemetry ingestion, and live-state APIs for the BusMate IoT platform layer.")
                .version("v0"));
    }
}
