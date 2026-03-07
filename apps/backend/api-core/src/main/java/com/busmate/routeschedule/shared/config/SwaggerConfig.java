package com.busmate.routeschedule.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.PathItem;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenApiCustomizer sortPathsCustomizer() {
        return openApi -> {
            // Define the preferred order of HTTP methods
            List<String> methodOrder = List.of("post", "get", "put", "patch", "delete");
            
            // Create a new LinkedHashMap to maintain order
            Map<String, PathItem> sortedPaths = new LinkedHashMap<>();
            
            // Sort paths by endpoint name first
            openApi.getPaths().entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    String path = entry.getKey();
                    PathItem pathItem = entry.getValue();
                    
                    // Create a new PathItem with operations in preferred order
                    PathItem sortedPathItem = new PathItem();
                    
                    // Add operations in the preferred order
                    methodOrder.forEach(method -> {
                        switch (method) {
                            case "post" -> {
                                if (pathItem.getPost() != null) {
                                    sortedPathItem.setPost(pathItem.getPost());
                                }
                            }
                            case "get" -> {
                                if (pathItem.getGet() != null) {
                                    sortedPathItem.setGet(pathItem.getGet());
                                }
                            }
                            case "put" -> {
                                if (pathItem.getPut() != null) {
                                    sortedPathItem.setPut(pathItem.getPut());
                                }
                            }
                            case "patch" -> {
                                if (pathItem.getPatch() != null) {
                                    sortedPathItem.setPatch(pathItem.getPatch());
                                }
                            }
                            case "delete" -> {
                                if (pathItem.getDelete() != null) {
                                    sortedPathItem.setDelete(pathItem.getDelete());
                                }
                            }
                        }
                    });
                    
                    sortedPaths.put(path, sortedPathItem);
                });
            
            openApi.setPaths(new io.swagger.v3.oas.models.Paths());
            sortedPaths.forEach((path, pathItem) -> openApi.getPaths().addPathItem(path, pathItem));
        };
    }
}