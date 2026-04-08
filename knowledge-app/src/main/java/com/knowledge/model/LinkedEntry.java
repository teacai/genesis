package com.knowledge.model;

/**
 * Projection for displaying an entry with its link metadata.
 */
public class LinkedEntry {

    private final Entry entry;
    private final String linkId;
    private final String label;
    private final String direction;

    public LinkedEntry(Entry entry, String linkId, String label, String direction) {
        this.entry = entry;
        this.linkId = linkId;
        this.label = label;
        this.direction = direction;
    }

    public Entry getEntry() { return entry; }
    public String getLinkId() { return linkId; }
    public String getLabel() { return label; }
    public String getDirection() { return direction; }
}
