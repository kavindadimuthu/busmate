package com.busmatelk.backend.service;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

/**
 * A user's profile photo: the first media surface in BusMate (INC-003).
 *
 * <p>Access is delegated to the same checks that already govern reading and writing the rest of
 * the profile, so a photo is exactly as reachable as the profile it belongs to and no more.
 *
 * <p>The storage key is always derived from the user id and never read from anywhere a client can
 * write. An earlier version recorded the key in the profile document and trusted it on read, which
 * let a user point their own profile at someone else's photo and read it through their own account
 * (INC-005). Deriving the key also makes a replacement overwrite the previous object in place, so
 * storage grows with the number of users rather than the number of edits.
 */
@Service
@RequiredArgsConstructor
public class ProfilePhotoService {

    /**
     * A profile field name reserved for the server. No longer written, but still stripped from
     * client edits so the name cannot be reused to mean something a reader might trust.
     */
    static final String RESERVED_PHOTO_KEY_FIELD = "profile_photo_key";

    private final UserRepository userRepository;
    private final UserService userService;
    private final MediaStorageService mediaStorageService;
    private final ImageSanitizer imageSanitizer;

    @Value("${media.max-upload-bytes}")
    private long maxUploadBytes;

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
        mediaStorageService.put(photoKeyFor(targetUserId), image.bytes(), image.contentType());
    }

    public Optional<MediaStorageService.StoredObject> readPhoto(UUID callerId, UUID targetUserId) {
        User target = findUserOrThrow(targetUserId);
        userService.requireReadAccess(callerId, targetUserId, target.getUserType().getName());
        return mediaStorageService.get(photoKeyFor(targetUserId));
    }

    private String photoKeyFor(UUID userId) {
        return "users/" + userId + "/avatar";
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }
}
