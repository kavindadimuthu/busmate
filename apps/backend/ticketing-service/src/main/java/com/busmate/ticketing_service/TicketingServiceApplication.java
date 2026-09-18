package com.busmate.ticketing_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling drives the seat-hold expiry sweep (INC-012) - a booking's hold frees on its
// own, not only when someone else's request happens to trigger the lazy expiry check.
@EnableScheduling
@SpringBootApplication
public class TicketingServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(TicketingServiceApplication.class, args);
	}

}
