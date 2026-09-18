package com.busmate.routeschedule.shared.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * The S3 client used for all media storage (ADR-009). Deliberately configured against an
 * explicit endpoint rather than AWS's default region-based resolution, because the endpoint
 * is the portability boundary: the same client talks to the local MinIO container, to a
 * self-hosted store on a VPS, or to managed S3, and which one it is remains a configuration
 * detail that no other class is aware of.
 */
@Configuration
public class MediaStorageConfig {

    @Bean
    public S3Client mediaS3Client(
            @Value("${media.s3.endpoint}") String endpoint,
            @Value("${media.s3.region}") String region,
            @Value("${media.s3.access-key}") String accessKey,
            @Value("${media.s3.secret-key}") String secretKey) {

        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                // MinIO and most self-hosted stores serve buckets as a path segment rather than
                // as a DNS subdomain, which is what the SDK would otherwise assume.
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }
}
