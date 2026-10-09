package com.mijing;
import com.mijing.service.HypothesisService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.ObjectMapper;
import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationTest {
    static final Path file;
    static { try {file = Files.createTempDirectory("mijing-test-").resolve("state.json");} catch(Exception e){throw new RuntimeException(e);} }
    @DynamicPropertySource static void properties(DynamicPropertyRegistry r) {r.add("mijing.state-file",file::toString);}
    @LocalServerPort int port;
    @Autowired ObjectMapper mapper;
    final HttpClient client = HttpClient.newHttpClient();
    static final String SNAPSHOT = """
        {"plans":[{"id":"a","name":"假说 A","nodes":[{"t":0,"label":"起点","positions":{}}]}],"active":0,"progress":2}
        """;
    @BeforeEach void reset() throws Exception {Files.deleteIfExists(file);Files.deleteIfExists(file.resolveSibling("kubi-state.json"));}
    HttpResponse<String> request(String method,String path,String body,String type,String origin) throws Exception {
        var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path));
        if(type!=null)b.header("Content-Type",type);if(origin!=null)b.header("Origin",origin);
        return client.send(b.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    @Test void servesFrontendAndHealth() throws Exception {
        var html=request("GET","/",null,null,null);assertEquals(200,html.statusCode());assertTrue(html.headers().firstValue("content-type").orElse("").contains("text/html"));assertTrue(html.body().contains("无人生还"));
        assertEquals(200,request("GET","/app.js",null,null,null).statusCode());
        assertTrue(request("GET","/api/health",null,null,null).body().contains("mijing-spring-boot"));
        assertEquals(404,request("GET","/backend/data/state.json",null,null,null).statusCode());
    }
    @Test void savesAndRestoresExistingFormat() throws Exception {
        assertEquals("null",request("GET","/api/state",null,null,null).body());
        assertEquals(200,request("PUT","/api/state",SNAPSHOT,"application/json",null).statusCode());
        assertEquals(mapper.readTree(SNAPSHOT),mapper.readTree(request("GET","/api/state",null,null,null).body()));
        assertEquals(mapper.readTree(SNAPSHOT),new HypothesisService(mapper,file.toString()).load());
    }
    @Test void rejectsInvalidRequestsWithoutOverwritingData() throws Exception {
        assertEquals(200,request("PUT","/api/state",SNAPSHOT,"application/json",null).statusCode());
        assertEquals(400,request("PUT","/api/state","{broken","application/json",null).statusCode());
        assertEquals(400,request("PUT","/api/state","{\"plans\":[]}","application/json",null).statusCode());
        assertEquals(415,request("PUT","/api/state",SNAPSHOT,"text/plain",null).statusCode());
        assertEquals(403,request("PUT","/api/state",SNAPSHOT,"application/json","https://example.com").statusCode());
        assertEquals(413,request("PUT","/api/state","x".repeat(2*1024*1024+1),"application/json",null).statusCode());
        assertEquals(mapper.readTree(SNAPSHOT),mapper.readTree(Files.readString(file)));
    }
    @Test void persistsRoutesIntervalsAndEnvironment() throws Exception {
        var tree = mapper.readTree(SNAPSHOT);
        var plan = (tools.jackson.databind.node.ObjectNode) tree.get("plans").get(0);
        plan.set("routes", mapper.readTree("[{\"person\":0,\"start\":0,\"end\":10,\"path\":[\"living\",\"hall\",\"corridor\",\"stairs\",\"upper5\",\"upper0\"]}]"));
        plan.set("intervals", mapper.readTree("[{\"person\":0,\"start\":0,\"end\":10,\"room\":\"living\",\"type\":\"testimony\",\"approx\":true}]"));
        ((tools.jackson.databind.node.ObjectNode) plan.get("nodes").get(0)).set("environment", mapper.readTree("{\"doors\":{\"door-0\":\"locked\"},\"windows\":{},\"keyHolder\":\"0\"}"));
        var body = mapper.writeValueAsString(tree);
        assertEquals(200, request("PUT", "/api/state", body, "application/json", null).statusCode());
        assertEquals(tree, mapper.readTree(request("GET", "/api/state", null, null, null).body()));
        assertEquals(400, request("PUT", "/api/state", body.replace("\"person\":0", "\"person\":99"), "application/json", null).statusCode());
        assertEquals(tree, mapper.readTree(Files.readString(file)));
    }
    @Test void isolatesNovelStateAndValidatesTowerRoutes() throws Exception {
        String kubi = """
            {"version":1,"active":0,"reading":"map","plans":[{"name":"媛首山","period":"free","placements":[{"person":35,"t":0,"place":"well"}],"routes":[{"person":3,"start":30,"end":60,"path":["shrine","towerEntry","towerTop","towerExit","frontTea","frontRoom"]}],"notes":[{"t":0,"text":"用户假设"}]}]}
            """;
        assertEquals(200,request("GET","/kubi.html",null,null,null).statusCode());
        assertEquals("null",request("GET","/api/works/kubi/state",null,null,null).body());
        assertEquals(200,request("PUT","/api/state",SNAPSHOT,"application/json",null).statusCode());
        assertEquals(200,request("PUT","/api/works/kubi/state",kubi,"application/json",null).statusCode());
        assertEquals(mapper.readTree(kubi),mapper.readTree(request("GET","/api/works/kubi/state",null,null,null).body()));
        assertEquals(mapper.readTree(SNAPSHOT),mapper.readTree(request("GET","/api/state",null,null,null).body()));
        assertEquals(400,request("PUT","/api/works/kubi/state",kubi.replace("towerEntry","well"),"application/json",null).statusCode());
        assertEquals(400,request("PUT","/api/works/kubi/state",kubi.replace("\"person\":35","\"person\":36"),"application/json",null).statusCode());
        assertEquals(403,request("PUT","/api/works/kubi/state",kubi,"application/json","https://example.com").statusCode());
        assertEquals(413,request("PUT","/api/works/kubi/state","x".repeat(2*1024*1024+1),"application/json",null).statusCode());
        assertEquals(mapper.readTree(kubi),mapper.readTree(Files.readString(file.resolveSibling("kubi-state.json"))));
    }
}
