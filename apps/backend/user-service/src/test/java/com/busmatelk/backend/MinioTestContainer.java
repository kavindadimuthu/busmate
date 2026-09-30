package com.busmatelk.backend;

import java.net.URI;
import java.time.Duration;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * A MinIO container for integration tests that is handed back only once it is really serving storage requests.
 *
 * <p>Waiting for MinIO's health endpoint alone is not enough. On a slow CI runner its first real requests, a bucket
 * create or an object PUT, were sometimes dropped ("Connection reset", "Client disconnected before response was
 * ready") even though the health check had passed, so whichever test happened to go first failed at random. That
 * never showed on a developer machine. This waits for the readiness endpoint and then makes the same kind of calls the
 * tests make, retrying until they succeed, so no test is the one that finds out MinIO was not ready.
 */
public final class MinioTestContainer {

    private static final String IMAGE = "bitnamilegacy/minio:2025.7.23-debian-12-r3";
    private static final String ACCESS_KEY = "testaccesskey";
    private static final String SECRET_KEY = "testsecretkey";
    private static final String WARMUP_BUCKET = "warmup";
    private static final Duration GIVE_UP_AFTER = Duration.ofSeconds(60);

    private MinioTestContainer() {
    }

    /** Starts MinIO with the credentials the tests use and returns it once it answers real storage calls. */
    @SuppressWarnings("resource")
    public static GenericContainer<?> start() {
        GenericContainer<?> minio = new GenericContainer<>(IMAGE)
                .withEnv("MINIO_ROOT_USER", ACCESS_KEY)
                .withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
                .withExposedPorts(9000)
                .waitingFor(Wait.forHttp("/minio/health/ready").forPort(9000));
        minio.start();
        awaitServing(URI.create("http://" + minio.getHost() + ":" + minio.getMappedPort(9000)));
        return minio;
    }

    private static void awaitServing(URI endpoint) {
        try (S3Client probe = S3Client.builder()
                .endpointOverride(endpoint)
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build()) {
            long deadline = System.nanoTime() + GIVE_UP_AFTER.toNanos();
            while (true) {
                try {
                    try {
                        probe.createBucket(CreateBucketRequest.builder().bucket(WARMUP_BUCKET).build());
                    } catch (BucketAlreadyOwnedByYouException ignored) {
                        // A previous attempt got this far.
                    }
                    probe.putObject(PutObjectRequest.builder().bucket(WARMUP_BUCKET).key("probe").build(), RequestBody.fromString("ok"));
                    probe.deleteObject(DeleteObjectRequest.builder().bucket(WARMUP_BUCKET).key("probe").build());
                    return;
                } catch (SdkException e) {
                    if (System.nanoTime() > deadline) {
                        throw new IllegalStateException("MinIO did not start serving storage requests within " + GIVE_UP_AFTER, e);
                    }
                    pause();
                }
            }
        }
    }

    private static void pause() {
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for MinIO", e);
        }
    }
}
