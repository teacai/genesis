package com.knowledge.service;

import com.knowledge.model.Entry;
import com.knowledge.repository.EntryLinkRepository;
import com.knowledge.repository.EntryRepository;
import jakarta.inject.Singleton;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Singleton
public class EntryService {

    private final EntryRepository entryRepository;
    private final EntryLinkRepository linkRepository;

    public EntryService(EntryRepository entryRepository, EntryLinkRepository linkRepository) {
        this.entryRepository = entryRepository;
        this.linkRepository = linkRepository;
    }

    public List<Entry> getRecent(int limit) {
        return entryRepository.findRecent(limit);
    }

    public List<Entry> getAll() {
        return entryRepository.findAllOrderByUpdatedAtDesc();
    }

    public Optional<Entry> getById(String id) {
        return entryRepository.findById(id);
    }

    public Entry create(String title, String content, String tags) {
        LocalDateTime now = LocalDateTime.now();
        Entry entry = new Entry(
                UUID.randomUUID().toString(),
                title.trim(),
                content,
                normalizeTags(tags),
                now,
                now
        );
        return entryRepository.save(entry);
    }

    public Entry update(String id, String title, String content, String tags) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + id));
        entry.setTitle(title.trim());
        entry.setContent(content);
        entry.setTags(normalizeTags(tags));
        entry.setUpdatedAt(LocalDateTime.now());
        return entryRepository.update(entry);
    }

    @Transactional
    public void delete(String id) {
        linkRepository.deleteByEntryId(id);
        entryRepository.deleteById(id);
    }

    public long count() {
        return entryRepository.count();
    }

    private String normalizeTags(String tags) {
        if (tags == null || tags.isBlank()) return "";
        String[] parts = tags.split(",");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            String trimmed = part.trim().toLowerCase();
            if (!trimmed.isEmpty()) {
                if (!sb.isEmpty()) sb.append(",");
                sb.append(trimmed);
            }
        }
        return sb.toString();
    }
}
