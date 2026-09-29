package com.busmate.routeschedule.postimport.dto;

import java.util.List;

/** The whole approve outcome: totals, plus one {@link RowLoadResult} per loaded or skipped row. */
public record LoadResult(
        int stopsCreated,
        int routesCreated,
        int schedulesCreated,
        int workingsCreated,
        List<RowLoadResult> rows) {
}
