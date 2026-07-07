package com.busmate.ticketing_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("BusmateLK Ticket Management API")
                        .version("1.0.0")
                        .description("API for managing ticket issuance, validation, QR code generation, and scan history tracking within the BusmateLK platform.")
                        .contact(new Contact().name("BusmateLK Team")))
                .addServersItem(new Server()
                        .url("http://localhost:8083")
                        .description("Local Development Server"))
                .addServersItem(new Server()
                        .url("http://54.91.217.117:8083")
                        .description("AWS EC2 Production Server"));
    }
}
