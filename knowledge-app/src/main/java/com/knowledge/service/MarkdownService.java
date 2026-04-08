package com.knowledge.service;

import com.knowledge.model.Entry;
import com.knowledge.repository.EntryRepository;
import com.vladsch.flexmark.ext.autolink.AutolinkExtension;
import com.vladsch.flexmark.ext.gfm.strikethrough.StrikethroughExtension;
import com.vladsch.flexmark.ext.tables.TablesExtension;
import com.vladsch.flexmark.ext.gfm.tasklist.TaskListExtension;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.util.data.MutableDataSet;
import com.vladsch.flexmark.util.misc.Extension;
import jakarta.inject.Singleton;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Singleton
public class MarkdownService {

    private static final Pattern WIKI_LINK = Pattern.compile("\\[\\[(.+?)]]");

    private final Parser parser;
    private final HtmlRenderer renderer;
    private final EntryRepository entryRepository;

    public MarkdownService(EntryRepository entryRepository) {
        this.entryRepository = entryRepository;

        List<Extension> extensions = List.of(
                TablesExtension.create(),
                StrikethroughExtension.create(),
                AutolinkExtension.create(),
                TaskListExtension.create()
        );

        MutableDataSet options = new MutableDataSet();
        options.set(Parser.EXTENSIONS, extensions);
        options.set(HtmlRenderer.SOFT_BREAK, "<br />\n");

        this.parser = Parser.builder(options).build();
        this.renderer = HtmlRenderer.builder(options).build();
    }

    /**
     * Render markdown content to HTML, resolving [[Title]] wiki-links to entry URLs.
     */
    public String render(String markdown) {
        if (markdown == null || markdown.isEmpty()) {
            return "";
        }

        String processed = resolveWikiLinks(markdown);

        Node document = parser.parse(processed);
        return renderer.render(document);
    }

    /**
     * Strip markdown to plain text for previews.
     */
    public String toPlainText(String markdown, int maxLength) {
        if (markdown == null || markdown.isEmpty()) {
            return "";
        }
        // Remove wiki-link syntax, keep the title text
        String text = WIKI_LINK.matcher(markdown).replaceAll("$1");
        // Strip common markdown syntax
        text = text.replaceAll("#{1,6}\\s+", "");
        text = text.replaceAll("\\*{1,3}(.+?)\\*{1,3}", "$1");
        text = text.replaceAll("_{1,3}(.+?)_{1,3}", "$1");
        text = text.replaceAll("~~(.+?)~~", "$1");
        text = text.replaceAll("!?\\[([^]]*)]\\([^)]*\\)", "$1");
        text = text.replaceAll("`{1,3}[^`]*`{1,3}", "");
        text = text.replaceAll("^\\s*[-*+>]\\s+", "");
        text = text.replaceAll("\\|", " ");
        text = text.replaceAll("\\s+", " ").trim();

        if (text.length() > maxLength) {
            return text.substring(0, maxLength) + "...";
        }
        return text;
    }

    /**
     * Replace [[Title]] with markdown links pointing to the matching entry.
     * If no entry found, render as a styled span indicating a broken link.
     */
    private String resolveWikiLinks(String markdown) {
        Matcher matcher = WIKI_LINK.matcher(markdown);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String title = matcher.group(1).trim();
            Optional<Entry> entry = findByTitle(title);
            String replacement;
            if (entry.isPresent()) {
                replacement = "[" + title + "](/entries/" + entry.get().getId() + ")";
            } else {
                replacement = "*" + title + "* (broken link)";
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private Optional<Entry> findByTitle(String title) {
        String term = title.toLowerCase();
        return entryRepository.findAllOrderByUpdatedAtDesc().stream()
                .filter(e -> e.getTitle().toLowerCase().equals(term))
                .findFirst();
    }
}
