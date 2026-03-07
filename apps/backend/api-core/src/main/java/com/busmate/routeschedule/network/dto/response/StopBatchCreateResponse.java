package com.busmate.routeschedule.network.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StopBatchCreateResponse {

    private int totalRequested;
    private int successCount;
    private int failedCount;
    private List<StopBatchResultItem> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StopBatchResultItem {
        private boolean success;
        private String requestedName;
        private StopResponse stop;
        private String error;

        public static StopBatchResultItem success(String requestedName, StopResponse stop) {
            return StopBatchResultItem.builder()
                    .success(true)
                    .requestedName(requestedName)
                    .stop(stop)
                    .build();
        }

        public static StopBatchResultItem failure(String requestedName, String error) {
            return StopBatchResultItem.builder()
                    .success(false)
                    .requestedName(requestedName)
                    .error(error)
                    .build();
        }
    }
}
