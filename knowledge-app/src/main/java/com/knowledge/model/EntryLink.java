package com.knowledge.model;

import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.MappedProperty;

import java.time.LocalDateTime;

@MappedEntity("entry_link")
public class EntryLink {

    @Id
    private String id;

    @MappedProperty("source_id")
    private String sourceId;

    @MappedProperty("target_id")
    private String targetId;

    private String label;

    @MappedProperty("created_at")
    private LocalDateTime createdAt;

    public EntryLink() {}

    public EntryLink(String id, String sourceId, String targetId, String label, LocalDateTime createdAt) {
        this.id = id;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.label = label;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
