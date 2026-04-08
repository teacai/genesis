package com.knowledge.repository;

import com.knowledge.model.EntryLink;
import io.micronaut.data.annotation.Query;
import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

@JdbcRepository(dialect = Dialect.H2)
public interface EntryLinkRepository extends CrudRepository<EntryLink, String> {

    @Query("""
        SELECT * FROM entry_link
        WHERE source_id = :entryId OR target_id = :entryId
        ORDER BY created_at DESC
        """)
    List<EntryLink> findByEntryId(String entryId);

    @Query("""
        SELECT * FROM entry_link
        WHERE (source_id = :sourceId AND target_id = :targetId)
           OR (source_id = :targetId AND target_id = :sourceId)
        """)
    Optional<EntryLink> findExistingLink(String sourceId, String targetId);

    @Query("DELETE FROM entry_link WHERE source_id = :entryId OR target_id = :entryId")
    void deleteByEntryId(String entryId);
}
