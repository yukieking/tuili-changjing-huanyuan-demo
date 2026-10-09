package com.mijing.service;
import com.mijing.api.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.*;
@Service
public class HypothesisService {
    private final Path file;
    private final ObjectMapper mapper;
    public HypothesisService(ObjectMapper mapper, @Value("${mijing.state-file}") String file) {
        this.mapper = mapper; this.file = Path.of(file).toAbsolutePath().normalize();
    }
    public synchronized JsonNode load() throws IOException {
        if (!Files.exists(file)) return mapper.readTree("null");
        return mapper.readTree(Files.readAllBytes(file));
    }
    public synchronized void save(byte[] body) throws IOException {
        JsonNode state;
        try { state = mapper.readTree(body); }
        catch (RuntimeException e) { throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_json"); }
        validate(state);
        Files.createDirectories(file.getParent());
        Path tmp = Files.createTempFile(file.getParent(), "snapshot-", ".tmp");
        try {
            Files.write(tmp, mapper.writeValueAsBytes(state));
            try { Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE); }
            catch (AtomicMoveNotSupportedException e) { Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING); }
        } finally { Files.deleteIfExists(tmp); }
    }
    private void validate(JsonNode state) {
        if (state == null || !state.isObject()) invalid();
        JsonNode plans = state.get("plans"), active = state.get("active"), progress = state.get("progress");
        if (plans == null || !plans.isArray() || plans.isEmpty()
            || active == null || !active.isIntegralNumber() || !active.canConvertToInt()
            || active.intValue() < 0 || active.intValue() >= plans.size()
            || progress == null || !progress.isIntegralNumber() || !progress.canConvertToInt()
            || progress.intValue() < 1 || progress.intValue() > 2) invalid();
        for (JsonNode plan : plans) {
            if (!plan.isObject() || !plan.hasNonNull("id") || !plan.get("id").isTextual()
                || !plan.hasNonNull("name") || !plan.get("name").isTextual()
                || !plan.hasNonNull("nodes") || !plan.get("nodes").isArray() || plan.get("nodes").isEmpty()) invalid();
            validateExtensions(plan);
            java.util.Set<Integer> times = new java.util.HashSet<>();
            for (JsonNode node : plan.get("nodes")) {
                JsonNode t = node.get("t");
                if (t == null || !t.isIntegralNumber() || !t.canConvertToInt() || t.intValue() < 0 || t.intValue() > 120
                    || !times.add(t.intValue()) || !node.hasNonNull("positions") || !node.get("positions").isObject()) invalid();
                validateEnvironment(node.get("environment"));
            }
        }
    }
    private void validateEnvironment(JsonNode environment) {
        if (environment == null) return;
        if (!environment.isObject()) invalid();
        for (String field : java.util.List.of("doors", "windows")) {
            JsonNode values = environment.get(field);
            if (values == null) continue;
            if (!values.isObject()) invalid();
            for (JsonNode value : values) {
                if (!value.isTextual() || !(field.equals("doors") ? java.util.Set.of("open", "locked") : java.util.Set.of("open", "closed")).contains(value.asText())) invalid();
            }
        }
    }
    private void validateExtensions(JsonNode plan) {
        JsonNode routes = plan.get("routes");
        // The previous prototype stored an empty object here; keep that format readable.
        if (routes != null && !routes.isArray() && !(routes.isObject() && routes.isEmpty())) invalid();
        if (routes != null && routes.isArray()) for (JsonNode route : routes) {
            if (!validPerson(route.get("person")) || !validTime(route.get("start")) || !validTime(route.get("end"))
                || route.get("end").intValue() <= route.get("start").intValue()
                || !route.hasNonNull("path") || !route.get("path").isArray() || route.get("path").size() < 2) invalid();
            for (JsonNode room : route.get("path")) if (!room.isTextual() || !ROOMS.contains(room.asText())) invalid();
        }
        JsonNode intervals = plan.get("intervals");
        if (intervals != null) {
            if (!intervals.isArray()) invalid();
            for (JsonNode interval : intervals) {
                if (!validPerson(interval.get("person")) || !validTime(interval.get("start")) || !validTime(interval.get("end"))
                    || interval.get("end").intValue() <= interval.get("start").intValue()
                    || !interval.hasNonNull("room") || !ROOMS.contains(interval.get("room").asText())
                    || !interval.hasNonNull("type") || !java.util.Set.of("hypothesis", "testimony").contains(interval.get("type").asText())) invalid();
            }
        }
    }
    private static final java.util.Set<String> ROOMS = java.util.Set.of("living", "dining", "kitchen", "hall", "corridor", "stairs", "terrace", "upper0", "upper1", "upper2", "upper3", "upper4", "upper5", "shore", "cliff", "villa");
    private boolean validPerson(JsonNode n) { return n != null && n.isIntegralNumber() && n.canConvertToInt() && n.intValue() >= 0 && n.intValue() < 10; }
    private boolean validTime(JsonNode n) { return n != null && n.isIntegralNumber() && n.canConvertToInt() && n.intValue() >= 0 && n.intValue() <= 120; }
    private void invalid() { throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_snapshot"); }
}
