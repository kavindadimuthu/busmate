package com.busmate.routeschedule.community;

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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.shared.client.AccountDirectory;
import com.busmate.routeschedule.shared.client.AccountDirectory.Account;

/** The rule as the dev profile has it: a newly signed-up passenger, email never verified, can apply end to end. */
@SpringBootTest(properties = "community.applications.require-verified-account=false")
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-078 applying without a verified email, locally")
class RelaxedApplicantRuleIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @MockitoBean private AccountDirectory accounts;

    private MockMvc mvc;
    private final UUID passenger = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private void account(String status, boolean verified) {
        when(accounts.find(passenger)).thenReturn(Optional.of(new Account(passenger, "passenger", status, verified)));
    }

    private ResultActions me() throws Exception {
        return mvc.perform(get("/api/community/me").with(user(passenger.toString()).roles("PASSENGER")));
    }

    private ResultActions apply() throws Exception {
        String body = "{\"motivation\":\"I ride the 138 every day\",\"corridorRouteGroupIds\":[],"
                + "\"affiliation\":\"NONE\",\"agreementVersion\":\"draft-1\"}";
        return mvc.perform(post("/api/community/applications").with(user(passenger.toString()).roles("PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    @Test
    @DisplayName("INC-078 a pending passenger with an unverified email is told they can apply, and can")
    void inc078_pendingUnverifiedPassengerApplies() throws Exception {
        account("pending", false);
        me().andExpect(status().isOk())
                .andExpect(jsonPath("$.canApply").value(true))
                .andExpect(jsonPath("$.cannotApplyReason").doesNotExist());
        apply().andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("APPLIED"));
        me().andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.cannotApplyReason").value("ALREADY_APPLIED"));
    }

    @Test
    @DisplayName("INC-078 a suspended account still can't apply, relaxed or not")
    void inc078_suspendedAccountStillRefused() throws Exception {
        account("suspended", true);
        me().andExpect(jsonPath("$.canApply").value(false))
                .andExpect(jsonPath("$.cannotApplyReason").value("ACCOUNT_NOT_ACTIVE"));
        apply().andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Your account is not active"));
    }

    @Test
    @DisplayName("INC-078 staff still can't apply, relaxed or not")
    void inc078_staffStillRefused() throws Exception {
        mvc.perform(get("/api/community/me").with(user(passenger.toString()).roles("MOT")))
                .andExpect(jsonPath("$.cannotApplyReason").value("NOT_A_PASSENGER"));
    }
}
