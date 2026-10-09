package com.mijing.api;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.Map;
@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> invalid(ApiException e) {
        return ResponseEntity.status(e.status()).body(Map.of("error", e.getMessage()));
    }
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, String>> storage(IOException e) {
        log.error("Hypothesis storage failed", e);
        return ResponseEntity.status(500).body(Map.of("error", "storage_error"));
    }
}
