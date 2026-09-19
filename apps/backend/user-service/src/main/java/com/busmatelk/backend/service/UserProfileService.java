package com.busmatelk.backend.service;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.operator.OperatorScope;
import com.busmatelk.backend.operator.OperatorSyncService;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ProfileSchemaValidator profileSchemaValidator;
    private final OperatorSyncService operatorSyncService;
    private final OperatorScope operatorScope;

    public Map<String, Object> getProfile(UUID callerId, UUID targetUserId) {
        User target = findUserOrThrow(targetUserId);
        userService.requireReadAccess(callerId, targetUserId, target.getUserType().getName());
        return findProfileOrThrow(targetUserId).getProfileData();
    }

    @Transactional
    public Map<String, Object> updateProfile(UUID callerId, UUID targetUserId, Map<String, Object> patch) {
        User target = findUserOrThrow(targetUserId);
        userService.requireUpdateAccess(callerId, targetUserId, target.getUserType().getName());

        UserProfile profile = findProfileOrThrow(targetUserId);
        // Which operator a conductor works for is not theirs, nor their operator's, to change
        // (INC-019): only a platform admin may move a conductor between operators.
        if (OperatorScope.isOperatorLinkChange(profile.getProfileData(), patch)
                && (callerId.equals(targetUserId) || operatorScope.operatorScopeOf(callerId).isPresent())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "A conductor's operator can only be changed by an administrator");
        }
        Map<String, Object> merged = new HashMap<>(profile.getProfileData());
        merged.putAll(patch);
        // Server-managed; a client-supplied value is dropped rather than rejected so that clients
        // echoing back the whole profile document keep working.
        merged.remove(ProfilePhotoService.RESERVED_PHOTO_KEY_FIELD);

        String userTypeName = target.getUserType().getName();
        profileSchemaValidator.validate(userTypeName, merged);

        profile.setProfileData(merged);
        profile = userProfileRepository.save(profile);
        operatorSyncService.syncProfileUpdate(targetUserId, userTypeName, merged, target.getAccountStatus());
        return profile.getProfileData();
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
