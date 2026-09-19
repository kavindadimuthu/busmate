package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.community.service.ContributorStanding;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.shared.client.AccountDirectory;
import com.busmate.routeschedule.shared.client.AccountDirectory.Account;
import com.busmate.routeschedule.shared.exception.ServiceUnavailableException;
import com.busmate.routeschedule.support.OperationsFixtures;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-029 contributor application")
class ContributorApplicationIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private ContributorRepository contributors;
    @Autowired private ContributorStanding standing;
    @Autowired private EntityManager em;
    @MockitoBean private AccountDirectory accounts;

    private MockMvc mvc;
    private final UUID passenger = UUID.randomUUID();
    private final UUID staff = UUID.randomUUID();
    private RouteGroup corridor;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        corridor = fx.routeGroup();
        verified(passenger, true);
    }

    private void verified(UUID id, boolean emailVerified) {
        when(accounts.find(id)).thenReturn(Optional.of(new Account(id, "passenger", "active", emailVerified)));
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private String application(String affiliation, String detail, String version) {
        return "{\"motivation\":\"I ride the 138 every day\",\"homeDistrict\":\"Colombo\","
                + "\"corridorRouteGroupIds\":[\"" + corridor.getId() + "\"],\"affiliation\":\"" + affiliation + "\","
                + (detail == null ? "" : "\"affiliationDetail\":\"" + detail + "\",")
                + "\"agreementVersion\":\"" + version + "\"}";
    }

    private ResultActions apply(UUID id, String role, String body) throws Exception {
        return mvc.perform(post("/api/community/applications").with(as(id, role))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions staffPost(String path, String body) throws Exception {
        var req = post("/api/community/contributors/" + passenger + path).with(as(staff, "MOT"));
        if (body != null) {
            req = req.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(req);
    }

    @Test
    @DisplayName("INC-029 a verified passenger applies under the current agreement and sees it under review")
    void inc029_verifiedPassengerApplies() throws Exception {
        apply(passenger, "PASSENGER", application("NONE", null, "draft-1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.agreementCurrent").value(true));
        mvc.perform(get("/api/community/me").with(as(passenger, "PASSENGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.canApply").value(false))
                .andExpect(jsonPath("$.cannotApplyReason").value("ALREADY_APPLIED"));
    }

    @Test
    @DisplayName("INC-029 a passenger with an unverified email is told why they cannot apply yet")
    void inc029_unverifiedEmailRefusedWithReason() throws Exception {
        verified(passenger, false);
        mvc.perform(get("/api/community/me").with(as(passenger, "PASSENGER")))
                .andExpect(jsonPath("$.status").value("NONE"))
                .andExpect(jsonPath("$.canApply").value(false))
                .andExpect(jsonPath("$.cannotApplyReason").value("EMAIL_NOT_VERIFIED"));
        apply(passenger, "PASSENGER", application("NONE", null, "draft-1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Verify your email address before applying"));
    }

    @Test
    @DisplayName("INC-029 staff and crew accounts cannot apply")
    void inc029_staffCannotApply() throws Exception {
        for (String role : new String[] {"MOT", "ADMIN", "OPERATOR", "CONDUCTOR"}) {
            apply(staff, role, application("NONE", null, "draft-1")).andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("INC-029 an application under an old agreement, or naming an operator link without detail, is refused")
    void inc029_applicationValidation() throws Exception {
        apply(passenger, "PASSENGER", application("NONE", null, "draft-0")).andExpect(status().isConflict());
        apply(passenger, "PASSENGER", application("OPERATOR_EMPLOYEE", null, "draft-1")).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("INC-029 user-service being unreachable refuses the application rather than assuming it verified")
    void inc029_accountLookupFailsClosed() throws Exception {
        when(accounts.find(any())).thenThrow(new ServiceUnavailableException("down"));
        apply(passenger, "PASSENGER", application("NONE", null, "draft-1")).andExpect(status().isServiceUnavailable());
        assertThat(contributors.findById(passenger)).isEmpty();
    }

    @Test
    @DisplayName("INC-029 staff see the declared affiliation, and a decline needs a reason the applicant then sees")
    void inc029_declineNeedsReasonApplicantSeesIt() throws Exception {
        apply(passenger, "PASSENGER", application("BUS_OWNER", "I own two buses on route 1", "draft-1"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/community/contributors").param("status", "APPLIED").with(as(staff, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].affiliation").value("BUS_OWNER"))
                .andExpect(jsonPath("$.content[0].affiliationDetail").value("I own two buses on route 1"));
        staffPost("/decline", "{}").andExpect(status().isBadRequest());
        staffPost("/decline", "{\"reason\":\"We are only inviting people this month\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DECLINED"));
        mvc.perform(get("/api/community/me").with(as(passenger, "PASSENGER")))
                .andExpect(jsonPath("$.status").value("DECLINED"))
                .andExpect(jsonPath("$.contributor.decisionReason").value("We are only inviting people this month"))
                .andExpect(jsonPath("$.canApply").value(true));
    }

    @Test
    @DisplayName("INC-029 accept, suspend and reinstate move a contributor through the states; invalid moves are refused")
    void inc029_stateMachine() throws Exception {
        apply(passenger, "PASSENGER", application("NONE", null, "draft-1"));
        staffPost("/reinstate", null).andExpect(status().isConflict());
        staffPost("/accept", null).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"));
        staffPost("/accept", null).andExpect(status().isConflict());
        staffPost("/suspend", "{}").andExpect(status().isBadRequest());
        staffPost("/suspend", "{\"reason\":\"Submitted a false timetable\"}").andExpect(jsonPath("$.status").value("SUSPENDED"));
        apply(passenger, "PASSENGER", application("NONE", null, "draft-1")).andExpect(status().isConflict());
        staffPost("/reinstate", null).andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.decisionReason").doesNotExist());
    }

    @Test
    @DisplayName("INC-029 suspension takes effect on the very next check, not on next login")
    void inc029_suspensionIsImmediate() throws Exception {
        apply(passenger, "PASSENGER", application("NONE", null, "draft-1"));
        staffPost("/accept", null);
        em.flush();
        assertThat(standing.isActiveContributor(passenger)).isTrue();
        staffPost("/suspend", "{\"reason\":\"x\"}");
        em.flush();
        assertThat(standing.isActiveContributor(passenger)).isFalse();
    }

    @Test
    @DisplayName("INC-029 standing fails closed: no row, applied, declined, or an out-of-date agreement all mean not active")
    void inc029_standingFailsClosed() {
        assertThat(standing.isActiveContributor(null)).isFalse();
        assertThat(standing.isActiveContributor(UUID.randomUUID())).isFalse();
        Contributor c = new Contributor();
        c.setUserId(UUID.randomUUID());
        c.setStatus(ContributorStatus.ACTIVE);
        c.setMotivation("m");
        c.setAffiliation(com.busmate.routeschedule.community.entity.Affiliation.NONE);
        c.setAgreementVersion("draft-0");
        c.setAgreementAcceptedAt(java.time.Instant.now());
        c.setAppliedAt(java.time.Instant.now());
        contributors.saveAndFlush(c);
        assertThat(standing.isActiveContributor(c.getUserId())).isFalse();
        c.setAgreementVersion("draft-1");
        contributors.saveAndFlush(c);
        assertThat(standing.isActiveContributor(c.getUserId())).isTrue();
        c.setStatus(ContributorStatus.APPLIED);
        contributors.saveAndFlush(c);
        assertThat(standing.isActiveContributor(c.getUserId())).isFalse();
    }

    @Test
    @DisplayName("INC-029 only staff can list or decide, and the applicant can re-accept the agreement in force")
    void inc029_accessAndReacceptance() throws Exception {
        apply(passenger, "PASSENGER", application("NONE", null, "draft-1"));
        mvc.perform(get("/api/community/contributors").with(as(passenger, "PASSENGER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/community/contributors/" + passenger + "/accept").with(as(passenger, "PASSENGER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/community/me/agreement").with(as(passenger, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"agreementVersion\":\"draft-1\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.agreementCurrent").value(true));
        mvc.perform(get("/api/community/agreement").with(as(passenger, "PASSENGER")))
                .andExpect(jsonPath("$.version").value("draft-1"))
                .andExpect(jsonPath("$.draft").value(true));
    }
}
