package com.busmate.routeschedule.community.dto;

import jakarta.validation.constraints.Size;

public record ResolveReportRequest(@Size(max = 500) String note) {
}
