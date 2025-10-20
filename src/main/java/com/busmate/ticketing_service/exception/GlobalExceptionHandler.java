package com.busmate.ticketing_service.exception;

import com.busmate.ticketing_service.dto.response.ErrorResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleNotFound(NotFoundException ex) {
        ErrorResponseDTO body = new ErrorResponseDTO(ex.getMessage(), "NOT_FOUND", System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponseDTO> handleBadRequest(BadRequestException ex) {
        ErrorResponseDTO body = new ErrorResponseDTO(ex.getMessage(), "BAD_REQUEST", System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleAny(Exception ex) {
        ErrorResponseDTO body = new ErrorResponseDTO("Internal server error", "INTERNAL_ERROR",
                System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
