package com.mijing.api;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;

/** A dated, curated snapshot; no live popularity or endorsement claims. */
@RestController
public class RecommendationController {
    private final JsonNode catalog;
    public RecommendationController(ObjectMapper mapper) throws IOException {
        try (var stream = new ClassPathResource("static/recommendations/catalog.json").getInputStream()) {
            catalog = mapper.readTree(stream.readAllBytes());
        }
    }
    @GetMapping(value = "/api/recommendations", produces = "application/json")
    public JsonNode list() { return catalog; }
}
