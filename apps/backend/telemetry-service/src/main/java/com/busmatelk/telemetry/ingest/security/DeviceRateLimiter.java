package com.busmatelk.telemetry.ingest.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-device rate limiting for {@code /ingest/**} (IoT Platform Layer plan, Phase 2): a simple
 * in-memory token bucket keyed by deviceId. One bucket per device, not per IP — a shared carrier
 * NAT IP shouldn't throttle another device's legitimate traffic, and the gateway's own IP-based
 * {@code rateLimiter} middleware already covers the coarser, per-IP case.
 *
 * <p>Single-instance only: buckets live in this process's heap. Move to a shared store (e.g.
 * Redis) if telemetry-service is ever scaled horizontally, since each instance would otherwise
 * enforce its own independent budget per device.
 */
@Component
public class DeviceRateLimiter {

    private final int capacity;
    private final double refillPerSecond;
    private final Map<UUID, Bucket> buckets = new ConcurrentHashMap<>();

    public DeviceRateLimiter(
            @Value("${telemetry.ingest.rate-limit.capacity}") int capacity,
            @Value("${telemetry.ingest.rate-limit.refill-per-second}") double refillPerSecond) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
    }

    /** Returns true and consumes one token if the device is within budget; false if rate-limited. */
    public boolean tryConsume(UUID deviceId) {
        Bucket bucket = buckets.computeIfAbsent(deviceId, id -> new Bucket(capacity));
        return bucket.tryConsume(capacity, refillPerSecond);
    }

    private static final class Bucket {
        private double tokens;
        private long lastRefillNanos;

        Bucket(int initialTokens) {
            this.tokens = initialTokens;
            this.lastRefillNanos = System.nanoTime();
        }

        synchronized boolean tryConsume(int capacity, double refillPerSecond) {
            long now = System.nanoTime();
            double elapsedSeconds = (now - lastRefillNanos) / 1_000_000_000.0;
            lastRefillNanos = now;
            tokens = Math.min(capacity, tokens + elapsedSeconds * refillPerSecond);

            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }
    }
}
