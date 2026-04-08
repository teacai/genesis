package com.knowledge.service;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.knowledge.model.Entry;
import com.knowledge.model.EntryLink;
import com.knowledge.repository.EntryLinkRepository;
import com.knowledge.repository.EntryRepository;
import jakarta.inject.Singleton;
import jakarta.transaction.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Singleton
public class BackupService {

    private static final String FORMAT_VERSION = "1";
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final JsonFactory JSON_FACTORY = new JsonFactory();

    private final EntryRepository entryRepository;
    private final EntryLinkRepository linkRepository;

    public BackupService(EntryRepository entryRepository, EntryLinkRepository linkRepository) {
        this.entryRepository = entryRepository;
        this.linkRepository = linkRepository;
    }

    public void exportBackup(OutputStream out) throws IOException {
        try (JsonGenerator gen = JSON_FACTORY.createGenerator(out)) {
            gen.setPrettyPrinter(new DefaultPrettyPrinter());
            gen.writeStartObject();

            gen.writeStringField("formatVersion", FORMAT_VERSION);
            gen.writeStringField("exportedAt", LocalDateTime.now().format(DT_FMT));

            gen.writeArrayFieldStart("entries");
            for (Entry e : entryRepository.findAllOrderByUpdatedAtDesc()) {
                gen.writeStartObject();
                gen.writeStringField("id", e.getId());
                gen.writeStringField("title", e.getTitle());
                gen.writeStringField("content", e.getContent() != null ? e.getContent() : "");
                gen.writeStringField("tags", e.getTags() != null ? e.getTags() : "");
                gen.writeStringField("createdAt", e.getCreatedAt().format(DT_FMT));
                gen.writeStringField("updatedAt", e.getUpdatedAt().format(DT_FMT));
                gen.writeEndObject();
            }
            gen.writeEndArray();

            gen.writeArrayFieldStart("links");
            List<String> seen = new ArrayList<>();
            for (Entry e : entryRepository.findAllOrderByUpdatedAtDesc()) {
                for (EntryLink link : linkRepository.findByEntryId(e.getId())) {
                    if (!seen.contains(link.getId())) {
                        seen.add(link.getId());
                        gen.writeStartObject();
                        gen.writeStringField("id", link.getId());
                        gen.writeStringField("sourceId", link.getSourceId());
                        gen.writeStringField("targetId", link.getTargetId());
                        gen.writeStringField("label", link.getLabel() != null ? link.getLabel() : "");
                        gen.writeStringField("createdAt", link.getCreatedAt().format(DT_FMT));
                        gen.writeEndObject();
                    }
                }
            }
            gen.writeEndArray();

            gen.writeEndObject();
        }
    }

    @Transactional
    public RestoreResult restoreBackup(InputStream in) throws IOException {
        int entriesRestored = 0;
        int linksRestored = 0;

        try (JsonParser parser = JSON_FACTORY.createParser(in)) {
            if (parser.nextToken() != JsonToken.START_OBJECT) {
                throw new IOException("Invalid backup file: expected JSON object");
            }

            // Clear existing data (links first due to FK constraints)
            linkRepository.deleteAll();
            entryRepository.deleteAll();

            while (parser.nextToken() != JsonToken.END_OBJECT) {
                String field = parser.currentName();
                parser.nextToken();

                switch (field) {
                    case "formatVersion" -> {
                        String version = parser.getText();
                        if (!FORMAT_VERSION.equals(version)) {
                            throw new IOException("Unsupported backup format version: " + version);
                        }
                    }
                    case "exportedAt" -> parser.getText();
                    case "entries" -> {
                        if (parser.currentToken() != JsonToken.START_ARRAY) {
                            throw new IOException("Invalid backup: 'entries' must be an array");
                        }
                        while (parser.nextToken() != JsonToken.END_ARRAY) {
                            Entry entry = parseEntry(parser);
                            entryRepository.save(entry);
                            entriesRestored++;
                        }
                    }
                    case "links" -> {
                        if (parser.currentToken() != JsonToken.START_ARRAY) {
                            throw new IOException("Invalid backup: 'links' must be an array");
                        }
                        while (parser.nextToken() != JsonToken.END_ARRAY) {
                            EntryLink link = parseLink(parser);
                            linkRepository.save(link);
                            linksRestored++;
                        }
                    }
                    default -> parser.skipChildren();
                }
            }
        }
        return new RestoreResult(entriesRestored, linksRestored);
    }

    private Entry parseEntry(JsonParser parser) throws IOException {
        Entry entry = new Entry();
        while (parser.nextToken() != JsonToken.END_OBJECT) {
            String field = parser.currentName();
            parser.nextToken();
            switch (field) {
                case "id" -> entry.setId(parser.getText());
                case "title" -> entry.setTitle(parser.getText());
                case "content" -> entry.setContent(parser.getText());
                case "tags" -> entry.setTags(parser.getText());
                case "createdAt" -> entry.setCreatedAt(LocalDateTime.parse(parser.getText(), DT_FMT));
                case "updatedAt" -> entry.setUpdatedAt(LocalDateTime.parse(parser.getText(), DT_FMT));
            }
        }
        return entry;
    }

    private EntryLink parseLink(JsonParser parser) throws IOException {
        EntryLink link = new EntryLink();
        while (parser.nextToken() != JsonToken.END_OBJECT) {
            String field = parser.currentName();
            parser.nextToken();
            switch (field) {
                case "id" -> link.setId(parser.getText());
                case "sourceId" -> link.setSourceId(parser.getText());
                case "targetId" -> link.setTargetId(parser.getText());
                case "label" -> {
                    String val = parser.getText();
                    link.setLabel(val.isEmpty() ? null : val);
                }
                case "createdAt" -> link.setCreatedAt(LocalDateTime.parse(parser.getText(), DT_FMT));
            }
        }
        return link;
    }

    public record RestoreResult(int entriesRestored, int linksRestored) {}
}
