package com.busmatelk.backend.security;

import com.busmatelk.backend.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
public class PermissionCheckAspect {

    private final PermissionService permissionService;

    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint pjp, RequiresPermission requiresPermission)
            throws Throwable {
        // Extract userId from Spring Security context (set by JwtAuthFilter)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = UUID.fromString((String) auth.getPrincipal());

        if (!permissionService.hasPermission(userId, requiresPermission.value())) {
            throw new AccessDeniedException("Permission denied: " + requiresPermission.value());
        }
        return pjp.proceed();
    }
}
