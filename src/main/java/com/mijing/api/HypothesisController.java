package com.mijing.api;
import com.mijing.service.HypothesisService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;
import java.io.IOException;
import java.util.Map;
@RestController
@RequestMapping("/api")
public class HypothesisController {
    public static final int MAX_BYTES = 2 * 1024 * 1024;
    private final HypothesisService service;
    public HypothesisController(HypothesisService service) { this.service = service; }
    @GetMapping("/health")
    public Map<String, String> health() { return Map.of("status", "ok", "service", "mijing-spring-boot", "version", "0.3.0"); }
    @GetMapping(value = "/state", produces = "application/json")
    public JsonNode load() throws IOException { return service.load(); }
    @PutMapping(value = "/state", consumes = "application/json", produces = "application/json")
    public Map<String, Boolean> save(HttpServletRequest request) throws IOException {
        if (request.getContentLengthLong() > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "snapshot_too_large");
        byte[] body = request.getInputStream().readNBytes(MAX_BYTES + 1);
        if (body.length > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "snapshot_too_large");
        service.save(body); return Map.of("saved", true);
    }
}
