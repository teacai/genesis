package com.knowledge.controller;

import com.knowledge.model.Entry;
import com.knowledge.model.LinkedEntry;
import com.knowledge.service.EntryService;
import com.knowledge.service.LinkService;
import com.knowledge.service.SearchService;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.*;
import io.micronaut.views.View;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class LinkController {

    private final LinkService linkService;
    private final SearchService searchService;
    private final EntryService entryService;

    public LinkController(LinkService linkService, SearchService searchService, EntryService entryService) {
        this.linkService = linkService;
        this.searchService = searchService;
        this.entryService = entryService;
    }

    @Get("/entries/{id}/links/search")
    @View("fragments/link-search-results")
    public Map<String, Object> searchLinkTarget(
            @PathVariable String id,
            @QueryValue(defaultValue = "") String q) {
        List<Entry> results = searchService.search(q);
        // Filter out the current entry from results
        results = results.stream().filter(e -> !e.getId().equals(id)).toList();
        Map<String, Object> model = new HashMap<>();
        model.put("entries", results);
        model.put("sourceId", id);
        return model;
    }

    @Post("/entries/{id}/links")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @View("fragments/link-section")
    public Map<String, Object> createLink(
            @PathVariable String id,
            @Body Map<String, String> form) {
        String targetId = form.get("targetId");
        String label = form.getOrDefault("label", "");
        try {
            linkService.createLink(id, targetId, label);
        } catch (IllegalArgumentException e) {
            // Link already exists or invalid — just refresh the section
        }
        List<LinkedEntry> linkedEntries = linkService.getLinkedEntries(id);
        Map<String, Object> model = new HashMap<>();
        model.put("linkedEntries", linkedEntries);
        model.put("entryId", id);
        return model;
    }

    @Post("/links/{linkId}/delete")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @View("fragments/link-section")
    public Map<String, Object> deleteLink(
            @PathVariable String linkId,
            @QueryValue String entryId) {
        linkService.deleteLink(linkId);
        List<LinkedEntry> linkedEntries = linkService.getLinkedEntries(entryId);
        Map<String, Object> model = new HashMap<>();
        model.put("linkedEntries", linkedEntries);
        model.put("entryId", entryId);
        return model;
    }
}
