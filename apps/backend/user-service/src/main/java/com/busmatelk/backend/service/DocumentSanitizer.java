package com.busmatelk.backend.service;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Accepts a scanned document (INC-018, INC-019): a PDF, or an image — which goes through
 * {@link ImageSanitizer} exactly like a photo, so a phone snapshot of a certificate loses its EXIF
 * location the same way. The uploader's declared content type is never trusted; the bytes decide.
 *
 * <p>A PDF is stored as uploaded (re-rendering one is not something the JDK can do), which is why
 * documents are only ever served as attachments with {@code nosniff} and a sandboxing CSP — never
 * rendered inline by this origin.
 */
@Component
@RequiredArgsConstructor
public class DocumentSanitizer {

    private static final byte[] PDF_MAGIC = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    private final ImageSanitizer imageSanitizer;

    public ImageSanitizer.SanitizedImage sanitize(byte[] uploaded) {
        if (uploaded.length > PDF_MAGIC.length
                && Arrays.equals(Arrays.copyOf(uploaded, PDF_MAGIC.length), PDF_MAGIC)) {
            return new ImageSanitizer.SanitizedImage(uploaded, "application/pdf");
        }
        try {
            return imageSanitizer.sanitize(uploaded);
        } catch (ImageSanitizer.UnsupportedImageException e) {
            throw new ImageSanitizer.UnsupportedImageException("A document must be a PDF or an image (JPEG or PNG).");
        }
    }
}
