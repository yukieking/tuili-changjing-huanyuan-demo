import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.concurrent.*;

/** Java 17 standalone demo server: static frontend and durable hypothesis snapshots. */
public class MijingServer {
  static Path root, store;
  static final int MAX_BYTES = 2 * 1024 * 1024;
  static final Object LOCK = new Object();
  public static void main(String[] args) throws Exception {
    root = Path.of(args.length > 0 ? args[0] : ".").toRealPath();
    int port = args.length > 1 ? Integer.parseInt(args[1]) : 8080;
    store = root.resolve("backend/data/state.json");
    Files.createDirectories(store.getParent());
    HttpServer server = HttpServer.create(new InetSocketAddress("localhost", port), 0);
    server.createContext("/", MijingServer::handle);
    server.setExecutor(Executors.newFixedThreadPool(8));
    server.start();
    System.out.println("谜境 Java 服务已启动：http://localhost:" + port);
    System.out.println("数据目录：" + store.getParent());
    Runtime.getRuntime().addShutdownHook(new Thread(() -> server.stop(1)));
  }
  static void handle(HttpExchange ex) throws IOException {
    try {
      String path = ex.getRequestURI().getPath(), method = ex.getRequestMethod();
      ex.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
      ex.getResponseHeaders().set("Cache-Control", "no-store");
      if (path.equals("/api/health")) {
        if (!method.equals("GET")) { reply(ex,405,"{\"error\":\"method_not_allowed\"}","application/json"); return; }
        reply(ex,200,"{\"status\":\"ok\",\"service\":\"mijing-java\",\"version\":\"0.2.0\"}","application/json"); return;
      }
      if (path.equals("/api/state")) {
        synchronized(LOCK) {
          if (method.equals("GET")) {
            reply(ex,200,Files.exists(store) ? Files.readString(store) : "null","application/json"); return;
          }
          if (method.equals("PUT")) {
            String origin = ex.getRequestHeaders().getFirst("Origin");
            String host = ex.getRequestHeaders().getFirst("Host");
            if (origin != null && !origin.equals("http://" + host)) { reply(ex,403,"{\"error\":\"origin_rejected\"}","application/json");return; }
            if (ex.getRequestHeaders().getFirst("Content-Type") == null || !ex.getRequestHeaders().getFirst("Content-Type").startsWith("application/json")) { reply(ex,415,"{\"error\":\"json_required\"}","application/json");return; }
            byte[] body = ex.getRequestBody().readNBytes(MAX_BYTES+1);
            if (body.length > MAX_BYTES) { reply(ex,413,"{\"error\":\"snapshot_too_large\"}","application/json");return; }
            String json = new String(body,StandardCharsets.UTF_8);
            try { new JsonValidator(json).validate(); } catch (IllegalArgumentException e) {reply(ex,400,"{\"error\":\"invalid_json\"}","application/json");return;}
            if (!json.stripLeading().startsWith("{") || !json.contains("\"plans\"")) {reply(ex,400,"{\"error\":\"invalid_snapshot\"}","application/json");return;}
            Path tmp = Files.createTempFile(store.getParent(),"snapshot-",".tmp");
            try {
              Files.writeString(tmp,json);
              try {Files.move(tmp,store,StandardCopyOption.REPLACE_EXISTING,StandardCopyOption.ATOMIC_MOVE);}
              catch(AtomicMoveNotSupportedException e){Files.move(tmp,store,StandardCopyOption.REPLACE_EXISTING);}
            } finally {Files.deleteIfExists(tmp);}
            reply(ex,200,"{\"saved\":true}","application/json"); return;
          }
        }
        reply(ex,405,"{\"error\":\"method_not_allowed\"}","application/json");return;
      }
      if (!method.equals("GET") && !method.equals("HEAD")) {reply(ex,405,"Method not allowed","text/plain");return;}
      // Explicit public file allowlist; never serve Java sources or saved user data.
      String file = switch(path) {case "/", "/index.html" -> "index.html"; case "/style.css" -> "style.css"; case "/app.js" -> "app.js"; default -> null;};
      if(file == null){reply(ex,404,"Not found","text/plain");return;}
      String type = file.endsWith(".html") ? "text/html" : file.endsWith(".css") ? "text/css" : "text/javascript";
      byte[] bytes = Files.readAllBytes(root.resolve(file));
      ex.getResponseHeaders().set("Content-Type",type+"; charset=utf-8");
      ex.sendResponseHeaders(200,method.equals("HEAD")?-1:bytes.length);
      if(!method.equals("HEAD")) ex.getResponseBody().write(bytes);
    } catch(Exception e) {
      System.err.println("Request failed: " + e.getClass().getSimpleName());
      reply(ex,500,"{\"error\":\"server_error\"}","application/json");
    } finally {ex.close();}
  }
  static void reply(HttpExchange ex,int status,String body,String type) throws IOException {
    byte[] bytes=body.getBytes(StandardCharsets.UTF_8);
    ex.getResponseHeaders().set("Content-Type",type+"; charset=utf-8");
    ex.sendResponseHeaders(status,bytes.length);ex.getResponseBody().write(bytes);
  }
  /** Syntax validation only; the frontend owns the demo snapshot schema. */
  static class JsonValidator {
    String s;int p,depth;JsonValidator(String s){this.s=s;}
    void validate(){value();ws();if(p!=s.length())bad();}
    void ws(){while(p<s.length() && " \n\r\t".indexOf(s.charAt(p))>=0)p++;}
    void bad(){throw new IllegalArgumentException();}
    boolean eat(char c){ws();if(p<s.length()&&s.charAt(p)==c){p++;return true;}return false;}
    void value(){ws();if(++depth>100||p>=s.length())bad();char c=s.charAt(p);
      if(c=='{'){p++;if(!eat('}')){do{string();if(!eat(':'))bad();value();}while(eat(','));if(!eat('}'))bad();}}
      else if(c=='['){p++;if(!eat(']')){do{value();}while(eat(','));if(!eat(']'))bad();}}
      else if(c=='"')string();
      else if(c=='t')literal("true");else if(c=='f')literal("false");else if(c=='n')literal("null");
      else {int start=p;if(c=='-')p++;if(p>=s.length())bad();if(s.charAt(p)=='0')p++;else digits();if(p<s.length()&&s.charAt(p)=='.'){p++;digits();}if(p<s.length()&&"eE".indexOf(s.charAt(p))>=0){p++;if(p<s.length()&&"+-".indexOf(s.charAt(p))>=0)p++;digits();}if(start==p)bad();}
      depth--;
    }
    void digits(){int start=p;while(p<s.length()&&s.charAt(p)>='0'&&s.charAt(p)<='9')p++;if(start==p)bad();}
    void literal(String x){if(!s.startsWith(x,p))bad();p+=x.length();}
    void string(){ws();if(p>=s.length()||s.charAt(p++)!='"')bad();while(p<s.length()){char c=s.charAt(p++);if(c=='"')return;if(c<32)bad();if(c=='\\'){if(p>=s.length())bad();char e=s.charAt(p++);if(e=='u'){for(int i=0;i<4;i++){if(p>=s.length()||Character.digit(s.charAt(p++),16)<0)bad();}}else if("\"\\/bfnrt".indexOf(e)<0)bad();}}bad();}
  }
}
