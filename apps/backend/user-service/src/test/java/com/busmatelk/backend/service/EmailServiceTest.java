package com.busmatelk.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void logsInsteadOfSendingWhenMailHostIsBlank() {
        EmailService emailService = new EmailService(mailSender, "", "no-reply@busmate.lk",
                "http://localhost:3000/reset-password", "http://localhost:3000/verify-email");

        emailService.sendPasswordResetEmail("someone@example.com", "raw-token-123");

        verifyNoInteractions(mailSender);
    }

    @Test
    void sendsAPasswordResetEmailWithAWorkingLinkWhenConfigured() {
        EmailService emailService = new EmailService(mailSender, "smtp.example.com", "no-reply@busmate.lk",
                "http://localhost:3000/reset-password", "http://localhost:3000/verify-email");

        emailService.sendPasswordResetEmail("someone@example.com", "raw-token-123");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();

        assertThat(sent.getFrom()).isEqualTo("no-reply@busmate.lk");
        assertThat(sent.getTo()).containsExactly("someone@example.com");
        assertThat(sent.getText()).contains("http://localhost:3000/reset-password?token=raw-token-123");
    }

    @Test
    void sendsAVerificationEmailWithAWorkingLinkWhenConfigured() {
        EmailService emailService = new EmailService(mailSender, "smtp.example.com", "no-reply@busmate.lk",
                "http://localhost:3000/reset-password", "http://localhost:3000/verify-email");

        emailService.sendVerificationEmail("someone@example.com", "raw-token-456");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getText()).contains("http://localhost:3000/verify-email?token=raw-token-456");
    }
}
