package com.busmatelk.backend.controller;


import com.busmatelk.backend.dto.response.UserDTO;
import com.busmatelk.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public List<UserDTO> getAllUsers() {
        try {
            return userService.getAllUsers();
        } catch (Exception e) {
            // Handle exceptions appropriately, e.g., log the error or return an error response
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve users: " + e.getMessage());
        }
    }
}
