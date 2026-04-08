package com.knowledge.controller;

import com.knowledge.model.Entry;
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

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @Get("/search")
    @View("fragments/search-results")
    public Map<String, Object> search(@QueryValue(defaultValue = "") String q) {
        List<Entry> results = searchService.search(q);
        Map<String, Object> model = new HashMap<>();
        model.put("entries", results);
        model.put("query", q);
        return model;
    }
}
