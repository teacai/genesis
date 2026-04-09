package com.knowledge.service;

import io.micronaut.context.annotation.Value;
import io.micronaut.context.event.StartupEvent;
import io.micronaut.runtime.event.annotation.EventListener;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Singleton
public class SecurityService {

    private static final Logger LOG = LoggerFactory.getLogger(SecurityService.class);
    private static final String KEY_PASSWORD_HASH = "password_hash";
    private static final String KEY_LOCK_TIMEOUT = "lock_timeout_minutes";

    @Value("${datasources.default.url}")
    String jdbcUrl;

    @Value("${datasources.default.username}")
    String dbUser;

    @Value("${datasources.default.password}")
    String dbPass;

    @Value("${knowledge.default-password:}")
    String defaultPassword;

    private String currentToken;
    private Instant lastActivity;

    @EventListener
    public void onStartup(StartupEvent event) {
        // If a default password is configured and no password is stored yet, set it
        if (defaultPassword != null && !defaultPassword.isEmpty() && getStoredPasswordHash() == null) {
            setPassword(defaultPassword);
            LOG.info("Default password set from configuration");
        }
    }

    public boolean isPasswordSet() {
        return getStoredPasswordHash() != null;
    }

    public boolean isLocked() {
        if (!isPasswordSet()) {
            return false;
        }
        if (currentToken == null) {
            return true;
        }
        int timeout = getLockTimeout();
        if (timeout > 0 && lastActivity != null) {
            if (Instant.now().isAfter(lastActivity.plusSeconds(timeout * 60L))) {
                lock();
                return true;
            }
        }
        return false;
    }

    public boolean unlock(String password) {
        String storedHash = getStoredPasswordHash();
        if (storedHash == null) {
            return true;
        }
        if (hashPassword(password).equals(storedHash)) {
            currentToken = UUID.randomUUID().toString();
            lastActivity = Instant.now();
            return true;
        }
        return false;
    }

    public void lock() {
        currentToken = null;
        lastActivity = null;
    }

    public String getCurrentToken() {
        return currentToken;
    }

    public boolean validateToken(String token) {
        if (currentToken == null || token == null) {
            return false;
        }
        if (currentToken.equals(token)) {
            int timeout = getLockTimeout();
            if (timeout > 0 && lastActivity != null
                    && Instant.now().isAfter(lastActivity.plusSeconds(timeout * 60L))) {
                lock();
                return false;
            }
            lastActivity = Instant.now();
            return true;
        }
        return false;
    }

    public void setPassword(String newPassword) {
        if (newPassword == null || newPassword.isEmpty()) {
            removeSetting(KEY_PASSWORD_HASH);
            lock();
        } else {
            saveSetting(KEY_PASSWORD_HASH, hashPassword(newPassword));
        }
    }

    public int getLockTimeout() {
        String val = getSetting(KEY_LOCK_TIMEOUT);
        if (val == null) return 10;
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            return 10;
        }
    }

    public void setLockTimeout(int minutes) {
        saveSetting(KEY_LOCK_TIMEOUT, String.valueOf(minutes));
    }

    private String getStoredPasswordHash() {
        return getSetting(KEY_PASSWORD_HASH);
    }

    static String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    private String getSetting(String key) {
        try (Connection conn = DriverManager.getConnection(jdbcUrl, dbUser, dbPass);
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT setting_value FROM app_settings WHERE setting_key = ?")) {
            stmt.setString(1, key);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return rs.getString(1);
            }
            return null;
        } catch (Exception e) {
            LOG.error("Failed to read setting: {}", key, e);
            return null;
        }
    }

    private void saveSetting(String key, String value) {
        try (Connection conn = DriverManager.getConnection(jdbcUrl, dbUser, dbPass);
             PreparedStatement stmt = conn.prepareStatement(
                     "MERGE INTO app_settings (setting_key, setting_value) VALUES (?, ?)")) {
            stmt.setString(1, key);
            stmt.setString(2, value);
            stmt.executeUpdate();
        } catch (Exception e) {
            LOG.error("Failed to save setting: {}", key, e);
        }
    }

    private void removeSetting(String key) {
        try (Connection conn = DriverManager.getConnection(jdbcUrl, dbUser, dbPass);
             PreparedStatement stmt = conn.prepareStatement(
                     "DELETE FROM app_settings WHERE setting_key = ?")) {
            stmt.setString(1, key);
            stmt.executeUpdate();
        } catch (Exception e) {
            LOG.error("Failed to remove setting: {}", key, e);
        }
    }
}
