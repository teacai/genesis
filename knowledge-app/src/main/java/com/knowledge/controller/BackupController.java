package com.knowledge.controller;

import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;

import java.net.URI;

@Controller("/backup")
public class BackupController {

    @Get
    public HttpResponse<?> redirectToSettings() {
        return HttpResponse.redirect(URI.create("/settings"));
    }

    @Get("/export")
    public HttpResponse<?> redirectExport() {
        return HttpResponse.redirect(URI.create("/settings/backup/export"));
    }
}
