package com.mijing.service;

import com.mijing.api.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

/** Independent snapshots for novel-specific scenes. Never reuses the original demo's state file. */
@Service
public class WorkStateService {
    private final ObjectMapper mapper;
    private final Path file;
    private static final Set<String> PLACES = Set.of("ichimori","nimori","sanmori","jinja","ritual","north","well","stone","northInner","east","kannon","eastWater","eastInner","south","southWater","southInner","courtyard","shrine","towerEntry","towerTop","towerExit","frontTea","frontRoom","middleTea","middleRoom","rearTea","rearRoom","toilet");
    private static final Set<String> EDGES = Set.of("ichimori|north","ritual|north","north|well","well|northInner","well|stone","northInner|courtyard","nimori|east","east|kannon","kannon|eastWater","eastWater|eastInner","eastInner|courtyard","sanmori|south","south|southWater","southWater|southInner","southInner|courtyard","courtyard|shrine","shrine|towerEntry","towerEntry|towerTop","towerTop|towerExit","towerExit|frontTea","towerExit|middleTea","towerExit|rearTea","frontTea|frontRoom","middleTea|middleRoom","rearTea|rearRoom","courtyard|toilet");
    public WorkStateService(ObjectMapper mapper, @Value("${mijing.state-file}") String demoFile) {
        this.mapper=mapper;
        this.file=Path.of(demoFile).toAbsolutePath().normalize().resolveSibling("kubi-state.json");
    }
    public synchronized JsonNode load() throws IOException {
        return Files.exists(file)?mapper.readTree(Files.readAllBytes(file)):mapper.readTree("null");
    }
    public synchronized void save(byte[] body) throws IOException {
        JsonNode state;
        try {state=mapper.readTree(body);} catch(RuntimeException e){throw new ApiException(HttpStatus.BAD_REQUEST,"invalid_json");}
        validate(state);
        Files.createDirectories(file.getParent());
        Path tmp=Files.createTempFile(file.getParent(),"kubi-snapshot-",".tmp");
        try {
            Files.write(tmp,mapper.writeValueAsBytes(state));
            try {Files.move(tmp,file,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}
            catch(AtomicMoveNotSupportedException e){Files.move(tmp,file,StandardCopyOption.REPLACE_EXISTING);}
        } finally {Files.deleteIfExists(tmp);}
    }
    private void validate(JsonNode s) {
        require(s!=null&&s.isObject());
        require(integer(s.get("version"),1,1)&&textIn(s.get("reading"),Set.of("map","eight")));
        JsonNode plans=s.get("plans");require(plans!=null&&plans.isArray()&&plans.size()>0&&plans.size()<=200);
        require(integer(s.get("active"),0,plans.size()-1));
        for(JsonNode p:plans){
            require(p.isObject()&&text(p.get("name"),100)&&textIn(p.get("period"),Set.of("free","thirteen","wedding")));
            for(String field:List.of("placements","routes","notes")) require(p.hasNonNull(field)&&p.get(field).isArray()&&p.get(field).size()<=5000);
            Set<String> snapshots=new HashSet<>();
            for(JsonNode x:p.get("placements")){
                require(x.isObject()&&person(x.get("person"))&&time(x.get("t"))&&place(x.get("place")));
                require(snapshots.add(x.get("person").asText()+":"+x.get("t").asText()));
            }
            for(JsonNode r:p.get("routes")){
                require(r.isObject()&&person(r.get("person"))&&time(r.get("start"))&&time(r.get("end"))&&r.get("end").intValue()>r.get("start").intValue());
                JsonNode path=r.get("path");require(path!=null&&path.isArray()&&path.size()>=2&&path.size()<=100);
                String previous=null;
                for(JsonNode loc:path){require(place(loc));String current=loc.asText();if(previous!=null)require(EDGES.contains(previous+"|"+current)||EDGES.contains(current+"|"+previous));previous=current;}
            }
            for(JsonNode n:p.get("notes"))require(n.isObject()&&time(n.get("t"))&&text(n.get("text"),2000));
        }
    }
    private boolean integer(JsonNode n,int min,int max){return n!=null&&n.isIntegralNumber()&&n.canConvertToInt()&&n.intValue()>=min&&n.intValue()<=max;}
    private boolean time(JsonNode n){return integer(n,0,180);}
    private boolean person(JsonNode n){return integer(n,0,35);}
    private boolean text(JsonNode n,int max){return n!=null&&n.isTextual()&&!n.asText().isBlank()&&n.asText().length()<=max;}
    private boolean textIn(JsonNode n,Set<String> values){return n!=null&&n.isTextual()&&values.contains(n.asText());}
    private boolean place(JsonNode n){return textIn(n,PLACES);}
    private void require(boolean valid){if(!valid)throw new ApiException(HttpStatus.BAD_REQUEST,"invalid_work_snapshot");}
}
