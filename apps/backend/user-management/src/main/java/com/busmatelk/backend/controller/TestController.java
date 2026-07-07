package com.busmatelk.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api")
public class TestController {
    @GetMapping("/secure")
    public String secure(Principal principal) {
        return "You are logged in as: " + principal.getName();
    }
}
