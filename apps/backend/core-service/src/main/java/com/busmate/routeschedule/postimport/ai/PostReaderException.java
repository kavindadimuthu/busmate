package com.busmate.routeschedule.postimport.ai;

/** The provider was unreachable, refused the request, or answered in a shape that doesn't fit {@code PostReading}. */
public class PostReaderException extends RuntimeException {

    public PostReaderException(String message) {
        super(message);
    }

    public PostReaderException(String message, Throwable cause) {
        super(message, cause);
    }
}
