package com.busmatelk.telemetry.shared.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Minimal authenticated principal, carrying comma-separated Spring authorities (e.g.
 * "ROLE_ADMIN,ROLE_MOT"). Mirrors the shape the other backend services use so @PreAuthorize
 * role checks behave identically here.
 */
public class UserPrincipal implements UserDetails {

    private final String username;
    private final String roles;

    public UserPrincipal(String username, String roles) {
        this.username = username;
        this.roles = roles;
    }

    @Override
    public Collection<? extends SimpleGrantedAuthority> getAuthorities() {
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
