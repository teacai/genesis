package com.knowledge.controller;

import com.knowledge.model.Entry;
import com.knowledge.model.LinkedEntry;
import com.knowledge.service.EntryService;
import com.knowledge.service.LinkService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.*;
import io.micronaut.views.View;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
public class EntryController {

    private final EntryService entryService;
    private final LinkService linkService;

    public EntryController(EntryService entryService, LinkService linkService) {
        this.entryService = entryService;
        this.linkService = linkService;
    }

    @Get("/")
    @View("index")
    public Map<String, Object> index() {
        Map<String, Object> model = new HashMap<>();
        model.put("entries", entryService.getRecent(20));
        model.put("totalEntries", entryService.count());
        return model;
    }

    @Get("/entries")
    @View("entry/list")
    public Map<String, Object> list() {
        Map<String, Object> model = new HashMap<>();
        model.put("entries", entryService.getAll());
        return model;
    }

    @Get("/entries/new")
    @View("entry/form")
    public Map<String, Object> newEntry() {
        Map<String, Object> model = new HashMap<>();
        model.put("entry", null);
        model.put("editing", false);
        return model;
    }

    @Get("/entries/{id}")
    @View("entry/view")
    public HttpResponse<?> show(@PathVariable String id) {
        Optional<Entry> entry = entryService.getById(id);
        if (entry.isEmpty()) {
            return HttpResponse.redirect(URI.create("/"));
        }
        List<LinkedEntry> linkedEntries = linkService.getLinkedEntries(id);
        Map<String, Object> model = new HashMap<>();
        model.put("entry", entry.get());
        model.put("linkedEntries", linkedEntries);
        return HttpResponse.ok(model);
    }

    @Get("/entries/{id}/edit")
    @View("entry/form")
    public HttpResponse<?> edit(@PathVariable String id) {
        Optional<Entry> entry = entryService.getById(id);
        if (entry.isEmpty()) {
            return HttpResponse.redirect(URI.create("/"));
        }
        Map<String, Object> model = new HashMap<>();
        model.put("entry", entry.get());
        model.put("editing", true);
        return HttpResponse.ok(model);
    }

    @Post("/entries")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public HttpResponse<?> create(@Body Map<String, String> form) {
        String title = form.getOrDefault("title", "").trim();
        if (title.isEmpty()) {
            return HttpResponse.redirect(URI.create("/entries/new"));
        }
        Entry entry = entryService.create(
                title,
                form.getOrDefault("content", ""),
                form.getOrDefault("tags", "")
        );
        return HttpResponse.redirect(URI.create("/entries/" + entry.getId()));
    }

    @Post("/entries/{id}")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public HttpResponse<?> update(@PathVariable String id, @Body Map<String, String> form) {
        String title = form.getOrDefault("title", "").trim();
        if (title.isEmpty()) {
            return HttpResponse.redirect(URI.create("/entries/" + id + "/edit"));
        }
        entryService.update(
                id,
                title,
                form.getOrDefault("content", ""),
                form.getOrDefault("tags", "")
        );
        return HttpResponse.redirect(URI.create("/entries/" + id));
    }

    @Post("/entries/{id}/delete")
    public HttpResponse<?> delete(@PathVariable String id) {
        entryService.delete(id);
        return HttpResponse.redirect(URI.create("/"));
    }
}
