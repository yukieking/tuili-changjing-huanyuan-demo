package com.tuiliatlas;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import java.net.URI;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper mapper;
    final HttpClient client=HttpClient.newHttpClient();
    HttpResponse<String> get(String path)throws Exception{return client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path)).GET().build(),HttpResponse.BodyHandlers.ofString());}
    @Test void servesTwoSectionsAndThreeWorkTimelines()throws Exception{
        assertTrue(get("/").body().contains("推理图鉴"));assertEquals(200,get("/recommendations.html").statusCode());
        assertTrue(get("/api/health").body().contains("推理图鉴"));assertEquals(3,mapper.readTree(get("/api/atlas").body()).get("works").size());
        for(String id:new String[]{"decagon","christie","kubi"}){
            assertEquals(200,get("/"+id+".html").statusCode());var response=get("/api/atlas/"+id);assertEquals(200,response.statusCode());
            var book=mapper.readTree(response.body());assertTrue(book.get("observed").size()>20);assertNull(book.get("truthOnly"));assertNull(book.get("truthNames"));
            assertEquals(200,get("/atlas/"+id+"/geometry.js").statusCode());assertEquals(200,get("/atlas/"+id+"/scene.js").statusCode());
        }
        assertTrue(mapper.readTree(get("/api/recommendations").body()).get("books").size()>=19);
    }
    @Test void removesLegacyRoutesAndRejectsUnknownWorks()throws Exception{
        for(String path:new String[]{"/reading.html","/decagon-reading.html","/pilgrimage.html","/app.js","/api/state","/api/works/kubi/state","/api/atlas/unknown","/backend/data/state.json"})assertEquals(404,get(path).statusCode(),path);
    }
}
