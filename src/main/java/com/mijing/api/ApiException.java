package com.mijing.api;
import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    public ApiException(HttpStatus status, String code) { super(code); this.status = status; }
    public HttpStatus status() { return status; }
}
