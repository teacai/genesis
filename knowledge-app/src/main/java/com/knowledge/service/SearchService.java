package com.knowledge.service;

import com.knowledge.model.Entry;
import com.knowledge.repository.EntryRepository;
import jakarta.inject.Singleton;

import java.util.List;

@Singleton
public class SearchService {

    private final EntryRepository entryRepository;

    public SearchService(EntryRepository entryRepository) {
        this.entryRepository = entryRepository;
    }

    public List<Entry> search(String query) {
        if (query == null || query.isBlank()) {
            return entryRepository.findRecent(20);
        }
        String term = "%" + query.trim() + "%";
        return entryRepository.search(term);
    }
}
