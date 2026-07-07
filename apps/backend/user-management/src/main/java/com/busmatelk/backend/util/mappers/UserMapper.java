package com.busmatelk.backend.util.mappers;

import com.busmatelk.backend.model.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User UserDtoToUser(User user);
}
