package com.busmatelk.telemetry.ingest;

/** A message could not be durably published (Kafka unreachable/timed out). Never silently dropped. */
public class IngestException extends RuntimeException {
    public IngestException(String message, Throwable cause) {
        super(message, cause);
    }
}
