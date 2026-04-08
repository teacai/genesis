package com.knowledge.model;

import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.MappedProperty;
import io.micronaut.data.annotation.Transient;

import java.time.LocalDateTime;

@MappedEntity("entry")
public class Entry {

    @Id
    private String id;

    private String title;

    private String content;

    private String tags;

    @MappedProperty("created_at")
    private LocalDateTime createdAt;

    @MappedProperty("updated_at")
    private LocalDateTime updatedAt;

    public Entry() {}

    public Entry(String id, String title, String content, String tags,
                 LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.tags = tags;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Transient
    public String[] getTagList() {
        if (tags == null || tags.isBlank()) return new String[0];
        return tags.split(",");
    }
}
