package com.knowledge.controller;

import com.knowledge.service.BackupService;
import com.knowledge.service.SecurityService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.MutableHttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.cookie.Cookie;
import io.micronaut.http.multipart.CompletedFileUpload;
import io.micronaut.views.View;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller
public class SettingsController {

    private final SecurityService securityService;
    private final BackupService backupService;

    public SettingsController(SecurityService securityService, BackupService backupService) {
        this.securityService = securityService;
        this.backupService = backupService;
    }

    // --- Lock screen ---

    @Get("/lock")
    @View("lock")
    public Map<String, Object> lockPage(@QueryValue(defaultValue = "") String error) {
        Map<String, Object> model = new HashMap<>();
        model.put("locked", securityService.isPasswordSet());
        model.put("error", error.isEmpty() ? null : error);
        return model;
    }

    @Post("/unlock")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public HttpResponse<?> unlock(@Body Map<String, String> form) {
        String password = form.getOrDefault("password", "");
        if (securityService.unlock(password)) {
            String token = securityService.getCurrentToken();
            Cookie cookie = Cookie.of("kb_session", token)
                    .path("/")
                    .httpOnly(true);
            return HttpResponse.redirect(URI.create("/"))
                    .cookie(cookie);
        }
        return HttpResponse.redirect(URI.create("/lock?error=1"));
    }

    @Post("/api/lock")
    public HttpResponse<?> lockNow() {
        securityService.lock();
        return HttpResponse.ok(Map.of("status", "locked"));
    }

    @Get("/api/lock-status")
    public HttpResponse<?> lockStatus() {
        return HttpResponse.ok(Map.of(
                "locked", securityService.isLocked(),
                "timeout", securityService.getLockTimeout()
        ));
    }

    // --- Settings page ---

    @Get("/settings")
    @View("settings")
    public Map<String, Object> settingsPage(
            @QueryValue(defaultValue = "") String success,
            @QueryValue(defaultValue = "") String error) {
        Map<String, Object> model = new HashMap<>();
        model.put("hasPassword", securityService.isPasswordSet());
        model.put("lockTimeout", securityService.getLockTimeout());
        model.put("success", success.isEmpty() ? null : success);
        model.put("error", error.isEmpty() ? null : error);
        return model;
    }

    @Post("/settings/password")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public HttpResponse<?> changePassword(@Body Map<String, String> form) {
        String currentPassword = form.getOrDefault("currentPassword", "");
        String newPassword = form.getOrDefault("newPassword", "");
        String confirmPassword = form.getOrDefault("confirmPassword", "");

        // If password is currently set, verify the current one
        if (securityService.isPasswordSet()) {
            if (!securityService.unlock(currentPassword)) {
                return HttpResponse.redirect(URI.create("/settings?error=wrong_password"));
            }
        }

        if (!newPassword.equals(confirmPassword)) {
            return HttpResponse.redirect(URI.create("/settings?error=mismatch"));
        }

        securityService.setPassword(newPassword);

        if (newPassword.isEmpty()) {
            // Password removed — clear session cookie
            Cookie cookie = Cookie.of("kb_session", "")
                    .path("/")
                    .maxAge(0);
            return HttpResponse.redirect(URI.create("/settings?success=password_removed"))
                    .cookie(cookie);
        }

        // Re-unlock with new password to get a fresh token
        securityService.unlock(newPassword);
        String token = securityService.getCurrentToken();
        Cookie cookie = Cookie.of("kb_session", token)
                .path("/")
                .httpOnly(true);
        return HttpResponse.redirect(URI.create("/settings?success=password_changed"))
                .cookie(cookie);
    }

    @Post("/settings/timeout")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public HttpResponse<?> changeTimeout(@Body Map<String, String> form) {
        String val = form.getOrDefault("timeout", "10");
        try {
            int minutes = Integer.parseInt(val);
            if (minutes < 0) minutes = 0;
            securityService.setLockTimeout(minutes);
        } catch (NumberFormatException e) {
            // ignore
        }
        return HttpResponse.redirect(URI.create("/settings?success=timeout_saved"));
    }

    @Post("/settings/lock")
    public HttpResponse<?> lockFromSettings() {
        securityService.lock();
        return HttpResponse.redirect(URI.create("/lock"));
    }

    // --- Backup (moved from BackupController) ---

    @Get("/settings/backup/export")
    public MutableHttpResponse<byte[]> export() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        backupService.exportBackup(out);
        String filename = "knowledge-backup-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd-HHmm"))
                + ".json";
        return HttpResponse.ok(out.toByteArray())
                .contentType(MediaType.APPLICATION_JSON_TYPE)
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"");
    }

    @Post("/settings/backup/restore")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public HttpResponse<?> restoreBackup(CompletedFileUpload file) {
        try {
            BackupService.RestoreResult result = backupService.restoreBackup(file.getInputStream());
            return HttpResponse.redirect(URI.create("/settings?success=restored_"
                    + result.entriesRestored() + "_" + result.linksRestored()));
        } catch (Exception e) {
            return HttpResponse.redirect(URI.create("/settings?error=restore_failed"));
        }
    }
}
