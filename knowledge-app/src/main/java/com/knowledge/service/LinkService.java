package com.knowledge.service;

import com.knowledge.model.Entry;
import com.knowledge.model.EntryLink;
import com.knowledge.model.LinkedEntry;
import com.knowledge.repository.EntryLinkRepository;
import com.knowledge.repository.EntryRepository;
import jakarta.inject.Singleton;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Singleton
public class LinkService {

    private final EntryLinkRepository linkRepository;
    private final EntryRepository entryRepository;

    public LinkService(EntryLinkRepository linkRepository, EntryRepository entryRepository) {
        this.linkRepository = linkRepository;
        this.entryRepository = entryRepository;
    }

    public List<LinkedEntry> getLinkedEntries(String entryId) {
        List<EntryLink> links = linkRepository.findByEntryId(entryId);
        List<LinkedEntry> result = new ArrayList<>();
        for (EntryLink link : links) {
            String linkedId = link.getSourceId().equals(entryId)
                    ? link.getTargetId()
                    : link.getSourceId();
            String direction = link.getSourceId().equals(entryId) ? "outgoing" : "incoming";
            Optional<Entry> entry = entryRepository.findById(linkedId);
            entry.ifPresent(e -> result.add(new LinkedEntry(e, link.getId(), link.getLabel(), direction)));
        }
        return result;
    }

    public EntryLink createLink(String sourceId, String targetId, String label) {
        if (sourceId.equals(targetId)) {
            throw new IllegalArgumentException("Cannot link an entry to itself");
        }
        Optional<EntryLink> existing = linkRepository.findExistingLink(sourceId, targetId);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Link already exists");
        }
        entryRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source entry not found"));
        entryRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Target entry not found"));

        EntryLink link = new EntryLink(
                UUID.randomUUID().toString(),
                sourceId,
                targetId,
                label != null && !label.isBlank() ? label.trim() : null,
                LocalDateTime.now()
        );
        return linkRepository.save(link);
    }

    public void deleteLink(String linkId) {
        linkRepository.deleteById(linkId);
    }

    public long countByEntryId(String entryId) {
        return linkRepository.findByEntryId(entryId).size();
    }
}
