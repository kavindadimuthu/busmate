package com.busmate.routeschedule.community.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * The contributor agreement in force (INC-029). Its text lives in
 * {@code community/contributor-agreement-<version>.md}; changing the version makes every active
 * contributor accept again before their next proposal.
 */
@Component
public class ContributorAgreement {

    private final String version;
    private final boolean draft;
    private final boolean allowDraftAcceptance;
    private final String text;

    public ContributorAgreement(@Value("${community.agreement.version}") String version,
                                @Value("${community.agreement.draft}") boolean draft,
                                @Value("${community.agreement.allow-draft-acceptance:false}") boolean allowDraftAcceptance) {
        this.version = version;
        this.draft = draft;
        this.allowDraftAcceptance = allowDraftAcceptance;
        ClassPathResource resource = new ClassPathResource("community/contributor-agreement-" + version + ".md");
        try {
            this.text = resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            // Refuse to start rather than serve an agreement nobody can read.
            throw new UncheckedIOException("Contributor agreement text missing for version " + version, e);
        }
    }

    public String version() {
        return version;
    }

    public boolean isDraft() {
        return draft;
    }

    public String text() {
        return text;
    }

    /** Whether staff may accept someone right now. A draft is never a real licence. */
    public boolean permitsAcceptance() {
        return !draft || allowDraftAcceptance;
    }
}
