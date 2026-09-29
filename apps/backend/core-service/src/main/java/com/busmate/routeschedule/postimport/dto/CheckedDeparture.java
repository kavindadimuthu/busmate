package com.busmate.routeschedule.postimport.dto;

import java.util.List;

/** One read departure alongside the result of the grounding check run against it. */
public record CheckedDeparture(ReadDeparture departure, boolean grounded, List<String> ungroundedFields) {
}
