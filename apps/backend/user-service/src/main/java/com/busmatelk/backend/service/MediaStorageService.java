package com.busmatelk.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.Optional;

/**
 * Reading and writing media objects, and the only class that knows storage exists.
 *
 * <p>It is deliberately free of any notion of what a media object <em>is</em> — no profile, no
 * vehicle, no image. Callers own their own key layout and their own access rules, so that the
 * next surface to need media reuses this unchanged. Per ADR-009 it speaks only the S3 API, which
 * is what keeps the endpoint behind it swappable as configuration.
 */
@Service
@RequiredArgsConstructor
public class MediaStorageService {

    public record StoredObject(byte[] bytes, String contentType) {}

    private final S3Client mediaS3Client;

    @Value("${media.s3.bucket}")
    private String bucket;

    public void put(String key, byte[] bytes, String contentType) {
        mediaS3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(bytes));
    }

    public Optional<StoredObject> get(String key) {
        try {
            ResponseBytes<GetObjectResponse> object = mediaS3Client.getObjectAsBytes(
                    GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .build());
            return Optional.of(new StoredObject(object.asByteArray(), object.response().contentType()));
        } catch (NoSuchKeyException e) {
            // A profile can reference a key whose object is gone — a restore that recovered the
            // database but not the bucket, for instance. That is a missing photo, not a failure.
            return Optional.empty();
        }
    }

    /** Idempotent: deleting a key that does not exist is not an error in S3. */
    public void delete(String key) {
        mediaS3Client.deleteObject(software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder()
                .bucket(bucket).key(key).build());
    }
}
