package com.busmate.routeschedule.postimport.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.busmate.routeschedule.postimport.dto.CreatePostImportRequest;
import com.busmate.routeschedule.postimport.dto.PostImportDraftResponse;
import com.busmate.routeschedule.postimport.dto.PostImportDraftSummary;
import com.busmate.routeschedule.postimport.service.PostImportService;
import com.busmate.routeschedule.shared.security.CallerContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Staff pastes a community post; an AI reads it; code checks the reading. Staff-only, always (ADR-028) — not
 * every contributor path, a deliberately optional tool for the people who choose to use it. Nothing here
 * loads anything into the network; see INC-061 for the approve-and-load half.
 */
@RestController
@RequestMapping("/api/community/post-imports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
@Tag(name = "12. AI Post Import", description = "Staff paste a community post; an AI reads it; code checks the reading (ADR-028)")
public class PostImportController {

    private final PostImportService service;
    private final CallerContext callerContext;

    @PostMapping
    @Operation(summary = "Read a pasted post and check the reading", operationId = "createPostImport")
    public PostImportDraftResponse create(@Valid @RequestBody CreatePostImportRequest request) {
        return service.create(callerContext.require(), request);
    }

    @GetMapping("/{id}")
    @Operation(summary = "One post import, with its reading and check results", operationId = "getPostImport")
    public PostImportDraftResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping
    @Operation(summary = "Past post imports, newest first", operationId = "listPostImports")
    public Page<PostImportDraftSummary> list(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return service.list(PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by("createdAt").descending()));
    }
}
