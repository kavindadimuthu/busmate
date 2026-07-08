package com.busmate.routeschedule.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean empty;
    
    public static <T> PaginatedResponse<T> of(List<T> content, int page, int size, long totalElements) {
        PaginatedResponse<T> response = new PaginatedResponse<>();
        response.content = content;
        response.page = page;
        response.size = size;
        response.totalElements = totalElements;
        response.totalPages = (int) Math.ceil((double) totalElements / size);
        response.first = page == 0;
        response.last = page >= response.totalPages - 1;
        response.empty = content.isEmpty();
        return response;
    }
}
