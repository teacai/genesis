package com.knowledge.filter;

import com.knowledge.service.SecurityService;
import io.micronaut.core.annotation.Nullable;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.RequestFilter;
import io.micronaut.http.annotation.ServerFilter;
import io.micronaut.http.cookie.Cookie;

import java.net.URI;

@ServerFilter("/**")
public class LockFilter {

    private final SecurityService securityService;

    public LockFilter(SecurityService securityService) {
        this.securityService = securityService;
    }

    @RequestFilter
    @Nullable
    public HttpResponse<?> filter(HttpRequest<?> request) {
        String path = request.getPath();

        // Always allow these paths
        if (path.startsWith("/static/")
                || path.equals("/lock")
                || path.equals("/unlock")
                || path.equals("/api/lock-status")) {
            return null;
        }

        if (!securityService.isPasswordSet()) {
            return null;
        }

        // Check the session token cookie
        String token = request.getCookies().findCookie("kb_session")
                .map(Cookie::getValue)
                .orElse(null);

        if (token != null && securityService.validateToken(token)) {
            return null;
        }

        // Locked — redirect to lock screen
        return HttpResponse.redirect(URI.create("/lock"));
    }
}
