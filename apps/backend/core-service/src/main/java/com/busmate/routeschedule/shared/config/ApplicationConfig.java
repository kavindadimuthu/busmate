package com.busmate.routeschedule.shared.config;

import org.modelmapper.Conditions;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        
        // Configure ModelMapper to handle ambiguous property mappings
        // Use STANDARD matching strategy to avoid automatic nested property traversal
        modelMapper.getConfiguration()
            .setMatchingStrategy(MatchingStrategies.STANDARD)
            .setAmbiguityIgnored(true)  // Ignore ambiguous mappings and use the first match
            .setSkipNullEnabled(true)
            .setPropertyCondition(Conditions.isNotNull());
        
        return modelMapper;
    }
}