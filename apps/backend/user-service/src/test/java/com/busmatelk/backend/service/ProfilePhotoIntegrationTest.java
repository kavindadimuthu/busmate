package com.busmatelk.backend.service;

import com.busmatelk.backend.AbstractPostgresIntegrationTest;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * INC-003 acceptance criteria, run against a real MinIO and a real Postgres.
 *
 * <p>Storage is a plain {@link GenericContainer} on the same image the Compose stack runs rather
 * than a dedicated Testcontainers module, so that proving the feature works costs no additional
 * dependency.
 */
@SpringBootTest
class ProfilePhotoIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final String BUCKET = "test-media";

    @SuppressWarnings("resource")
    static final GenericContainer<?> MINIO =
            new GenericContainer<>("quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z")
                    .withEnv("MINIO_ROOT_USER", "testaccesskey")
                    .withEnv("MINIO_ROOT_PASSWORD", "testsecretkey")
                    .withCommand("server", "/data")
                    .withExposedPorts(9000)
                    .waitingFor(Wait.forHttp("/minio/health/live").forPort(9000));

    static {
        MINIO.start();
    }

    @DynamicPropertySource
    static void mediaProperties(DynamicPropertyRegistry registry) {
        registry.add("media.s3.endpoint",
                () -> "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000));
        registry.add("media.s3.access-key", () -> "testaccesskey");
        registry.add("media.s3.secret-key", () -> "testsecretkey");
        registry.add("media.s3.bucket", () -> BUCKET);
    }

    @Autowired
    private ProfilePhotoService profilePhotoService;
    @Autowired
    private S3Client mediaS3Client;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;
    @Autowired
    private UserTypeRepository userTypeRepository;

    private UUID owner;
    private UUID otherPassenger;

    @BeforeEach
    void setUp() {
        try {
            mediaS3Client.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        } catch (BucketAlreadyOwnedByYouException ignored) {
            // Created by an earlier test in this class; the container is shared.
        }
        owner = createPassengerWithProfile();
        otherPassenger = createPassengerWithProfile();
    }

    @Test
    void inc003_uploadedPhotoIsReturnedToItsOwner() {
        profilePhotoService.replacePhoto(owner, owner, pngBytes(64, 64, Color.RED));

        Optional<MediaStorageService.StoredObject> photo = profilePhotoService.readPhoto(owner, owner);

        assertThat(photo).isPresent();
        assertThat(photo.get().bytes()).isNotEmpty();
        assertThat(photo.get().contentType()).startsWith("image/");
    }

    @Test
    void inc003_userWithNoPhotoGetsAnEmptyAnswerRatherThanAnError() {
        assertThat(profilePhotoService.readPhoto(owner, owner)).isEmpty();
    }

    @Test
    void inc003_aUserCannotReadAnotherUsersPhoto() {
        profilePhotoService.replacePhoto(owner, owner, pngBytes(16, 16, Color.BLUE));

        assertThatThrownBy(() -> profilePhotoService.readPhoto(otherPassenger, owner))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void inc003_aUserCannotOverwriteAnotherUsersPhoto() {
        assertThatThrownBy(() -> profilePhotoService.replacePhoto(
                otherPassenger, owner, pngBytes(16, 16, Color.BLUE)))
                .isInstanceOf(AccessDeniedException.class);
    }

    /**
     * The profile document is editable by its owner, so nothing stored in it can decide which
     * object a photo read returns. Before this was fixed, writing another user's storage key into
     * your own profile and then reading your own photo returned theirs — the read access check
     * passed, because it was checked against your own account, not theirs.
     */
    @Test
    void inc005_editingYourOwnProfileCannotRedirectYourPhotoToSomeoneElses(
            @Autowired UserProfileService userProfileService) {
        profilePhotoService.replacePhoto(owner, owner, pngBytes(16, 16, Color.RED));

        Map<String, Object> hijack = new HashMap<>();
        hijack.put("profile_photo_key", "users/" + owner + "/avatar");
        userProfileService.updateProfile(otherPassenger, otherPassenger, hijack);

        assertThat(profilePhotoService.readPhoto(otherPassenger, otherPassenger))
                .as("a user with no photo of their own must not be served another user's photo")
                .isEmpty();
    }

    @Test
    void inc003_aFileThatIsNotAnImageIsRejectedAndStoresNothing() {
        byte[] html = "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> profilePhotoService.replacePhoto(owner, owner, html))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("image");

        assertThat(storedObjectCountFor(owner)).isZero();
    }

    /**
     * A PNG renamed and declared as a JPEG still has to be stored as what it actually is, because
     * the declared type is never consulted — only the bytes are.
     */
    @Test
    void inc003_theDeclaredFileTypeIsIgnoredInFavourOfTheActualBytes() {
        profilePhotoService.replacePhoto(owner, owner, jpegBytes(32, 32));

        assertThat(profilePhotoService.readPhoto(owner, owner))
                .get()
                .extracting(MediaStorageService.StoredObject::contentType)
                .isEqualTo("image/jpeg");
    }

    @Test
    void inc003_anOversizedUploadIsRejectedWithASizeMessageAndStoresNothing() {
        byte[] oversized = new byte[6 * 1024 * 1024];

        assertThatThrownBy(() -> profilePhotoService.replacePhoto(owner, owner, oversized))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("too large");

        assertThat(storedObjectCountFor(owner)).isZero();
    }

    @Test
    void inc003_exifMetadataIsStrippedFromAStoredPhoto() {
        byte[] withExif = jpegWithExifSegment();
        assertThat(containsExifMarker(withExif))
                .as("the fixture must actually carry EXIF, or this test proves nothing")
                .isTrue();

        profilePhotoService.replacePhoto(owner, owner, withExif);

        byte[] stored = profilePhotoService.readPhoto(owner, owner).orElseThrow().bytes();
        assertThat(containsExifMarker(stored)).isFalse();
    }

    @Test
    void inc003_replacingAPhotoLeavesExactlyOneObject() {
        profilePhotoService.replacePhoto(owner, owner, pngBytes(16, 16, Color.RED));
        profilePhotoService.replacePhoto(owner, owner, pngBytes(24, 24, Color.GREEN));
        profilePhotoService.replacePhoto(owner, owner, jpegBytes(48, 48));

        assertThat(storedObjectCountFor(owner)).isEqualTo(1);
    }

    private int storedObjectCountFor(UUID userId) {
        return mediaS3Client.listObjectsV2(ListObjectsV2Request.builder()
                .bucket(BUCKET)
                .prefix("users/" + userId + "/")
                .build()).keyCount();
    }

    private UUID createPassengerWithProfile() {
        UserType passenger = userTypeRepository.findByName("passenger").orElseThrow();
        UUID userId = UUID.randomUUID();
        User user = userRepository.save(User.builder()
                .userId(userId)
                .email(userId + "@phototest.example.com")
                .userType(passenger)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        Map<String, Object> profileData = new HashMap<>();
        profileData.put("full_name", "Photo Test");
        userProfileRepository.save(UserProfile.builder()
                .user(user)
                .profileData(profileData)
                .build());
        return userId;
    }

    private static byte[] pngBytes(int width, int height, Color colour) {
        return encode(solidImage(width, height, colour, BufferedImage.TYPE_INT_ARGB), "png");
    }

    private static byte[] jpegBytes(int width, int height) {
        return encode(solidImage(width, height, Color.GRAY, BufferedImage.TYPE_INT_RGB), "jpg");
    }

    private static BufferedImage solidImage(int width, int height, Color colour, int type) {
        BufferedImage image = new BufferedImage(width, height, type);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(colour);
        graphics.fillRect(0, 0, width, height);
        graphics.dispose();
        return image;
    }

    private static byte[] encode(BufferedImage image, String format) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, format, out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * ImageIO will not write EXIF, so the fixture is assembled by hand: a real JPEG with an APP1
     * segment spliced in directly after the start-of-image marker, which is exactly where a
     * camera or phone puts it.
     */
    private static byte[] jpegWithExifSegment() {
        byte[] jpeg = jpegBytes(32, 32);
        byte[] exifPayload = "Exif\0\0GPSLatitude=6.9271;GPSLongitude=79.8612".getBytes(StandardCharsets.US_ASCII);
        int segmentLength = exifPayload.length + 2;

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(jpeg[0]);                          // 0xFF
        out.write(jpeg[1]);                          // 0xD8 — start of image
        out.write(0xFF);
        out.write(0xE1);                             // APP1
        out.write((segmentLength >> 8) & 0xFF);
        out.write(segmentLength & 0xFF);
        out.write(exifPayload, 0, exifPayload.length);
        out.write(jpeg, 2, jpeg.length - 2);
        return out.toByteArray();
    }

    private static boolean containsExifMarker(byte[] bytes) {
        byte[] marker = "Exif".getBytes(StandardCharsets.US_ASCII);
        outer:
        for (int i = 0; i <= bytes.length - marker.length; i++) {
            for (int j = 0; j < marker.length; j++) {
                if (bytes[i + j] != marker[j]) {
                    continue outer;
                }
            }
            return true;
        }
        return false;
    }
}
