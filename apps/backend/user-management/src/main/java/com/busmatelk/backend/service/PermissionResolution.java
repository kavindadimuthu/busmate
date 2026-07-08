package com.busmatelk.backend.service;

/**
 * source is "user_override" or "user_type_permission" — mirrors the two-step resolution
 * PermissionService.hasPermission() already does, but that method only returns a boolean,
 * so /internal/auth/check-permission needs its own copy of the same logic to expose which
 * step actually produced the answer.
 */
public record PermissionResolution(boolean granted, String source) {
}
