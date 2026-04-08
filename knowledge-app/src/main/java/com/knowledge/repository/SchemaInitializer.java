package com.knowledge.repository;

import io.micronaut.context.annotation.Value;
import io.micronaut.context.event.StartupEvent;
import io.micronaut.runtime.event.annotation.EventListener;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

@Singleton
public class SchemaInitializer {

    private static final Logger LOG = LoggerFactory.getLogger(SchemaInitializer.class);

    @Value("${datasources.default.url}")
    String jdbcUrl;

    @Value("${datasources.default.username}")
    String username;

    @Value("${datasources.default.password}")
    String password;

    @EventListener
    public void onStartup(StartupEvent event) {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("db/schema.sql")) {
            if (is == null) {
                LOG.error("schema.sql not found on classpath");
                return;
            }
            String sql = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password);
                 Statement stmt = conn.createStatement()) {
                for (String statement : sql.split(";")) {
                    String trimmed = statement.trim();
                    if (!trimmed.isEmpty()) {
                        stmt.execute(trimmed);
                    }
                }
                LOG.info("Database schema initialized");
            }
        } catch (Exception e) {
            LOG.error("Failed to initialize database schema", e);
            throw new RuntimeException(e);
        }
    }
}
