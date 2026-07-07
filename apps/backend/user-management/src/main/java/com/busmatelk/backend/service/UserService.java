package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.response.UserDTO;

import java.util.List;

public interface UserService {
     List<UserDTO> getAllUsers();

}
