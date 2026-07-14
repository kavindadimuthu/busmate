package com.busmate.routeschedule.passengerinfo.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerPaginatedResponse<T> {
    private List<T> content;
    private Long totalElements;
    private Integer totalPages;
    private Integer currentPage;
    private Integer size;
    private Boolean hasNext;
    private Boolean hasPrevious;
    private Boolean first;
    private Boolean last;
}
