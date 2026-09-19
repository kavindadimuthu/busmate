package com.busmatelk.backend.operator;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Operators manage their own conductors only (INC-019).
 *
 * <p>The permission rows give an operator {@code user.conductor:*} with scope {@code any}; this
 * class narrows that to conductors whose {@code assign_operator_id} is the caller's own
 * core-service Operator. It applies only when the caller is an operator account — admin and MOT
 * keep their platform-wide reach — and is checked in addition to the permission, never instead.
 */
@Service
@RequiredArgsConstructor
public class OperatorScope {

    public static final String CONDUCTOR = "conductor";
    public static final String OPERATOR_LINK_FIELD = "assign_operator_id";

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final CoreOperatorLookup coreOperatorLookup;

    /** The caller's own Operator id when the caller is an operator account; empty otherwise. */
    public Optional<UUID> operatorScopeOf(UUID callerId) {
        User caller = userRepository.findById(callerId).orElse(null);
        if (caller == null || !OperatorSyncService.OPERATOR_USER_TYPE.equals(caller.getUserType().getName())) {
            return Optional.empty();
        }
        return Optional.of(coreOperatorLookup.operatorIdForUser(callerId)
                .orElseThrow(() -> new AccessDeniedException("No operator record is linked to this account")));
    }

    /**
     * Refuses an operator acting on an account that is not one of their own conductors. Does
     * nothing for other callers, and nothing when the caller acts on themselves (own-profile
     * access has its own permission).
     */
    public void requireWithinScope(UUID callerId, User target) {
        if (callerId.equals(target.getUserId())) {
            return;
        }
        Optional<UUID> scope = operatorScopeOf(callerId);
        if (scope.isEmpty()) {
            return;
        }
        if (!CONDUCTOR.equals(target.getUserType().getName())
                || !Objects.equals(scope.get().toString(), linkedOperatorOf(target.getUserId()))) {
            throw new AccessDeniedException("You can only manage your own operator's conductors");
        }
    }

    /** The Operator id a conductor account is assigned to, as stored in their profile. */
    public String linkedOperatorOf(UUID userId) {
        return userProfileRepository.findByUserUserId(userId)
                .map(UserProfile::getProfileData)
                .map(data -> data.get(OPERATOR_LINK_FIELD))
                .map(Object::toString)
                .orElse(null);
    }

    public static boolean isOperatorLinkChange(Map<String, Object> current, Map<String, Object> patch) {
        return patch.containsKey(OPERATOR_LINK_FIELD)
                && !Objects.equals(String.valueOf(patch.get(OPERATOR_LINK_FIELD)), String.valueOf(current.get(OPERATOR_LINK_FIELD)));
    }
}
