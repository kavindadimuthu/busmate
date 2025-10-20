package com.busmatelk.backend.service.impl;

import com.busmatelk.backend.dto.response.UserDTO;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.UserRepo;
import com.busmatelk.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserServiceIMPL implements UserService {

    @Autowired
    private UserRepo userRepo;

    @Override
    public List<UserDTO> getAllUsers() {
        List<User> users = userRepo.findAll();
        List<UserDTO> userDTOs = new ArrayList<>();

        for (User user : users) {
            UserDTO userDTO = new UserDTO();
            userDTO.setFullName(user.getFullName());
            userDTO.setUsername(user.getUsername());
            userDTO.setPhoneNumber(user.getPhoneNumber());
            userDTO.setEmail(user.getEmail());
            userDTO.setRole(user.getRole());
            userDTO.setAccountStatus(user.getAccountStatus());
            userDTO.setLastLoginAt(user.getLastLoginAt());

            userDTOs.add(userDTO);
        }

        return userDTOs;
    }
}
