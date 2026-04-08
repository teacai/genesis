package com.knowledge.controller;

import com.knowledge.model.Entry;
import com.knowledge.service.MarkdownService;
import com.knowledge.service.SearchService;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.QueryValue;
import io.micronaut.views.View;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class SearchController {

    private final SearchService searchService;
    private final MarkdownService markdownService;

    public SearchController(SearchService searchService, MarkdownService markdownService) {
        this.searchService = searchService;
        this.markdownService = markdownService;
    }

    @Get("/search")
    @View("fragments/search-results")
    public Map<String, Object> search(@QueryValue(defaultValue = "") String q) {
        List<Entry> results = searchService.search(q);
        Map<String, String> previews = new HashMap<>();
        for (Entry e : results) {
            previews.put(e.getId(), markdownService.toPlainText(e.getContent(), 200));
        }
        Map<String, Object> model = new HashMap<>();
        model.put("entries", results);
        model.put("previews", previews);
        model.put("query", q);
        return model;
    }
}
