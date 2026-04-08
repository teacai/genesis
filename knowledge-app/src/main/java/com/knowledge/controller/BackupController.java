package com.knowledge.controller;

import com.knowledge.service.BackupService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.MutableHttpResponse;
import io.micronaut.http.annotation.Consumes;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.multipart.CompletedFileUpload;
import io.micronaut.views.View;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller("/backup")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @Get
    @View("backup")
    public Map<String, Object> backupPage() {
        return new HashMap<>();
    }

    @Get("/export")
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

    @Post("/restore")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @View("backup")
    public HttpResponse<?> restore(CompletedFileUpload file) {
        Map<String, Object> model = new HashMap<>();
        try {
            BackupService.RestoreResult result = backupService.restoreBackup(file.getInputStream());
            model.put("success", "Restored " + result.entriesRestored() + " entries and "
                    + result.linksRestored() + " links.");
        } catch (Exception e) {
            model.put("error", "Restore failed: " + e.getMessage());
        }
        return HttpResponse.ok(model);
    }
}
