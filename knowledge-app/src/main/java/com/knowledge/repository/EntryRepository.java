package com.knowledge.repository;

import com.knowledge.model.Entry;
import io.micronaut.data.annotation.Query;
import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;

import java.util.List;

@JdbcRepository(dialect = Dialect.H2)
public interface EntryRepository extends CrudRepository<Entry, String> {

    List<Entry> findAllOrderByUpdatedAtDesc();

    @Query("SELECT * FROM entry ORDER BY updated_at DESC LIMIT :limit")
    List<Entry> findRecent(int limit);

    @Query("""
        SELECT * FROM entry
        WHERE LOWER(title) LIKE LOWER(:term)
           OR LOWER(content) LIKE LOWER(:term)
           OR LOWER(tags) LIKE LOWER(:term)
        ORDER BY updated_at DESC
        """)
    List<Entry> search(String term);
}
