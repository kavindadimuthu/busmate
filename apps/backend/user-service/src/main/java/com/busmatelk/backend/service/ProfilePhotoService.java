package com.busmatelk.backend.service;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

/**
 * A user's profile photo: the first media surface in BusMate (INC-003).
 *
 * <p>Access is delegated to the same checks that already govern reading and writing the rest of
 * the profile, so a photo is exactly as reachable as the profile it belongs to and no more —
 * there is no second, media-specific notion of who may see what to drift out of step.
 *
 * <p>The key is derived from the user id rather than stored and generated, which is what makes
 * a replacement overwrite the previous object in place. Storage therefore grows with the number
 * of users rather than the number of edits, and no orphan can outlive the profile row that
 * pointed at it.
 */
@Service
@RequiredArgsConstructor
public class ProfilePhotoService {

    /** Lives inside the profile's JSON document alongside every other profile attribute. */
    static final String PHOTO_KEY_FIELD = "profile_photo_key";

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserService userService;
    private final MediaStorageService mediaStorageService;
    private final ImageSanitizer imageSanitizer;

    @Value("${media.max-upload-bytes}")
    private long maxUploadBytes;

    @Transactional
    public void replacePhoto(UUID callerId, UUID targetUserId, byte[] uploaded) {
        User target = findUserOrThrow(targetUserId);
        userService.requireUpdateAccess(callerId, targetUserId, target.getUserType().getName());

        if (uploaded == null || uploaded.length == 0) {
            throw new IllegalArgumentException("No file was uploaded.");
        }
        if (uploaded.length > maxUploadBytes) {
            throw new IllegalArgumentException(
                    "The file is too large: " + uploaded.length + " bytes, and the limit is "
                            + maxUploadBytes + " bytes.");
        }

        // Sanitising before storing is what keeps a rejected upload from leaving anything behind.
        ImageSanitizer.SanitizedImage image = imageSanitizer.sanitize(uploaded);

        String key = photoKeyFor(targetUserId);
        mediaStorageService.put(key, image.bytes(), image.contentType());

        UserProfile profile = findProfileOrThrow(targetUserId);
        Map<String, Object> updated = new HashMap<>(profile.getProfileData());
        updated.put(PHOTO_KEY_FIELD, key);
        profile.setProfileData(updated);
        userProfileRepository.save(profile);
    }

    public Optional<MediaStorageService.StoredObject> readPhoto(UUID callerId, UUID targetUserId) {
        User target = findUserOrThrow(targetUserId);
        userService.requireReadAccess(callerId, targetUserId, target.getUserType().getName());

        Object key = findProfileOrThrow(targetUserId).getProfileData().get(PHOTO_KEY_FIELD);
        if (!(key instanceof String storedKey) || storedKey.isBlank()) {
            return Optional.empty();
        }
        return mediaStorageService.get(storedKey);
    }

    private String photoKeyFor(UUID userId) {
        return "users/" + userId + "/avatar";
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }

    private UserProfile findProfileOrThrow(UUID userId) {
        return userProfileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found for user: " + userId));
    }
}
