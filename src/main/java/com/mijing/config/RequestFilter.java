package com.mijing.config;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
@Component
public class RequestFilter extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (req.getRequestURI().startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
        String origin = req.getHeader("Origin");
        if ("PUT".equals(req.getMethod()) && req.getRequestURI().equals("/api/state")
            && origin != null && !origin.equals(req.getScheme() + "://" + req.getHeader("Host"))) {
            res.setStatus(403);res.setContentType("application/json");res.getWriter().write("{\"error\":\"origin_rejected\"}");return;
        }
        chain.doFilter(req,res);
    }
}
