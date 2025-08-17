package com.busmate.routeschedule.util;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.entity.Stop;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MapperUtils {
    private final ModelMapper modelMapper;

    public <S, T> T map(S source, Class<T> targetClass) {
        return modelMapper.map(source, targetClass);
    }

    public <S, T> void map(S source, T target) {
        modelMapper.map(source, target);
    }

    // Add this method to handle Stop.Location to LocationDto conversion
    public LocationDto toLocationDto(Stop.Location location) {
        if (location == null) {
            return null;
        }
        // Use the existing ModelMapper to handle the conversion
        return modelMapper.map(location, LocationDto.class);
    }

    // Add this method to handle LocationDto to Stop.Location conversion
    public Stop.Location toLocationEntity(LocationDto locationDto) {
        if (locationDto == null) {
            return null;
        }
        // Use the existing ModelMapper to handle the conversion
        return modelMapper.map(locationDto, Stop.Location.class);
    }
}