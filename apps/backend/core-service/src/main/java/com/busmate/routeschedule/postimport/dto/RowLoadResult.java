package com.busmate.routeschedule.postimport.dto;

/** What happened when this row was loaded, and why — never silent, one line per row. */
public record RowLoadResult(int sourceIndex, RowLoadStatus status, String detail) {
}
