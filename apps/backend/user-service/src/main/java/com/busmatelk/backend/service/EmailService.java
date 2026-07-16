package com.busmatelk.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Sends the two auth emails (password reset, email verification), in-house since Phase 3 of the
 * auth migration replaces Supabase's GoTrue email delivery.
 *
 * <p>When {@code spring.mail.host} isn't configured — a fresh local checkout, or CI — sending is
 * skipped in favor of logging the would-be email, so local dev and tests work without a real
 * mailbox. Every other environment must set real SMTP config (see {@code .env.example}).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final boolean sendingEnabled;
    private final String fromAddress;
    private final String resetPasswordBaseUrl;
    private final String verifyEmailBaseUrl;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${auth.email.from}") String fromAddress,
            @Value("${auth.email.reset-password-url}") String resetPasswordBaseUrl,
            @Value("${auth.email.verify-email-url}") String verifyEmailBaseUrl) {
        this.mailSender = mailSender;
        this.sendingEnabled = !mailHost.isBlank();
        this.fromAddress = fromAddress;
        this.resetPasswordBaseUrl = resetPasswordBaseUrl;
        this.verifyEmailBaseUrl = verifyEmailBaseUrl;
    }

    public void sendPasswordResetEmail(String to, String rawToken) {
        String link = appendToken(resetPasswordBaseUrl, rawToken);
        send(to, "Reset your BusMate password",
                "We received a request to reset your BusMate password. This link expires in 30 "
                        + "minutes:\n\n" + link
                        + "\n\nIf you didn't request this, you can safely ignore this email.");
    }

    public void sendVerificationEmail(String to, String rawToken) {
        String link = appendToken(verifyEmailBaseUrl, rawToken);
        send(to, "Verify your BusMate email address",
                "Welcome to BusMate! Please confirm your email address. This link expires in 24 "
                        + "hours:\n\n" + link);
    }

    private void send(String to, String subject, String body) {
        if (!sendingEnabled) {
            log.warn("spring.mail.host is not configured - logging email instead of sending.\n"
                    + "To: {}\nSubject: {}\n{}", to, subject, body);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    private static String appendToken(String baseUrl, String rawToken) {
        String encodedToken = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + "token=" + encodedToken;
    }
}
