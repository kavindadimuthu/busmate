package com.busmate.routeschedule.postimport.dto;

import java.util.UUID;

/** An existing stop that might be what a place name in the post refers to — staff confirm it, code never does. */
public record StopMatchCandidate(UUID stopId, String name, String city) {
}
