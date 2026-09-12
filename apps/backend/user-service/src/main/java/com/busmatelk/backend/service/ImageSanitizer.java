package com.busmatelk.backend.service;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

/**
 * Turns untrusted uploaded bytes into bytes we are willing to store and serve.
 *
 * <p>The whole design rests on decoding the image and re-encoding it from the decoded pixels.
 * That single step does three jobs at once: it proves the bytes really are an image rather
 * than something wearing an image's name, it discards every metadata segment — EXIF GPS
 * coordinates and capture timestamps included, which invariant 8 requires — and it guarantees
 * the stored object cannot also be valid HTML or script, because the output is written by our
 * encoder rather than copied from the upload.
 *
 * <p>The uploader's declared content type is never consulted. It is an assertion by an
 * untrusted party, and trusting it is how an image bucket starts serving active content.
 */
@Component
public class ImageSanitizer {

    public record SanitizedImage(byte[] bytes, String contentType) {}

    /**
     * Extends IllegalArgumentException so that GlobalExceptionHandler already answers it with a
     * 400 carrying this message — a rejected upload is the caller's problem to fix, and the
     * message has to say which problem it was.
     */
    public static class UnsupportedImageException extends IllegalArgumentException {
        public UnsupportedImageException(String message) {
            super(message);
        }
    }

    /**
     * A small file can still decode to an enormous raster — a highly compressible image is the
     * standard way to turn an upload limit into a memory exhaustion bug. Dimensions are checked
     * from the header before any pixels are decoded.
     */
    private static final long MAX_PIXELS = 25_000_000L;

    public SanitizedImage sanitize(byte[] uploaded) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(uploaded))) {
            if (input == null) {
                throw new UnsupportedImageException("The uploaded file could not be read as an image.");
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new UnsupportedImageException(
                        "The uploaded file is not an image format this server can decode.");
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(input);
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                if (pixels > MAX_PIXELS) {
                    throw new UnsupportedImageException(
                            "The image's dimensions are too large; it decodes to " + pixels
                                    + " pixels and the limit is " + MAX_PIXELS + ".");
                }
                return reEncode(reader.read(0));
            } finally {
                reader.dispose();
            }
        } catch (IOException e) {
            throw new UnsupportedImageException("The uploaded file could not be read as an image.");
        }
    }

    /**
     * Transparency decides the output format: flattening an image with an alpha channel into
     * JPEG would silently fill the transparent areas, so those stay PNG and everything else
     * becomes JPEG.
     */
    private SanitizedImage reEncode(BufferedImage decoded) throws IOException {
        boolean hasAlpha = decoded.getColorModel().hasAlpha();
        String format = hasAlpha ? "png" : "jpg";
        String contentType = hasAlpha ? "image/png" : "image/jpeg";

        BufferedImage output = hasAlpha ? decoded : withoutAlphaChannel(decoded);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        if (!ImageIO.write(output, format, out)) {
            throw new UnsupportedImageException("The image could not be re-encoded for storage.");
        }
        return new SanitizedImage(out.toByteArray(), contentType);
    }

    /**
     * The JPEG writer cannot handle an image that still carries an alpha channel, which some
     * decoders produce even for formats without transparency.
     */
    private BufferedImage withoutAlphaChannel(BufferedImage source) {
        if (source.getType() == BufferedImage.TYPE_INT_RGB) {
            return source;
        }
        BufferedImage rgb = new BufferedImage(
                source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = rgb.createGraphics();
        try {
            graphics.drawImage(source, 0, 0, Color.WHITE, null);
        } finally {
            graphics.dispose();
        }
        return rgb;
    }
}
