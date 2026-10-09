package com.tuiliatlas.api;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
@RestController
public class AtlasController {
    private final JsonNode manifest, recommendations;
    private final Map<String, JsonNode> works;
    public AtlasController(ObjectMapper mapper) throws IOException {
        manifest=read(mapper,"atlas/manifest.json");
        recommendations=read(mapper,"recommendations/catalog.json");
        var records=new HashMap<String,JsonNode>();
        for(String id:new String[]{"decagon","christie","kubi"})records.put(id,read(mapper,"atlas/"+id+"/events.json"));
        works=Map.copyOf(records);
    }
    private JsonNode read(ObjectMapper mapper,String path) throws IOException {
        try(var stream=new ClassPathResource("static/"+path).getInputStream()){return mapper.readTree(stream.readAllBytes());}
    }
    @GetMapping("/api/health") public Map<String,String> health(){return Map.of("status","ok","name","推理图鉴","version","1.0.0");}
    @GetMapping("/api/atlas") public JsonNode manifest(){return manifest;}
    @GetMapping("/api/atlas/{id}") public JsonNode work(@PathVariable String id){
        var record=works.get(id);if(record==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);return record;
    }
    @GetMapping("/api/recommendations") public JsonNode recommendations(){return recommendations;}
}
