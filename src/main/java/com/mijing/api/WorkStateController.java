package com.mijing.api;

import com.mijing.service.WorkStateService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/works/kubi")
public class WorkStateController {
    private final WorkStateService service;
    public WorkStateController(WorkStateService service){this.service=service;}
    @GetMapping(value="/state",produces="application/json")
    public JsonNode load() throws IOException {return service.load();}
    @PutMapping(value="/state",consumes="application/json",produces="application/json")
    public Map<String,Boolean> save(HttpServletRequest request) throws IOException {
        if(request.getContentLengthLong()>HypothesisController.MAX_BYTES)throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE,"snapshot_too_large");
        byte[] body=request.getInputStream().readNBytes(HypothesisController.MAX_BYTES+1);
        if(body.length>HypothesisController.MAX_BYTES)throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE,"snapshot_too_large");
        service.save(body);return Map.of("saved",true);
    }
}
