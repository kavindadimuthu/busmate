package com.busmatelk.backend.service;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
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
        Map<String, Object> merged = new HashMap<>(profile.getProfileData());
        merged.putAll(patch);

        profileSchemaValidator.validate(target.getUserType().getName(), merged);

        profile.setProfileData(merged);
        profile = userProfileRepository.save(profile);
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
