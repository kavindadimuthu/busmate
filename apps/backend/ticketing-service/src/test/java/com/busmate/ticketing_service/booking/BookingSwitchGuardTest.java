package com.busmate.ticketing_service.booking;

import com.busmate.ticketing_service.exception.BookingClosedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** INC-072: production can't be started in the one combination that hands out free tickets. */
class BookingSwitchGuardTest {

    private static MockEnvironment profile(String... profiles) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles(profiles);
        return env;
    }

    @Test
    @DisplayName("INC-072: production with booking open and payments on the dummy gateway refuses to start")
    void productionOpenOnDummyPaymentsRefusesToStart() {
        assertThatThrownBy(() -> new BookingSwitch(true, false, profile("prod")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("dummy");
    }

    @Test
    @DisplayName("INC-072: production may open booking once real payments are on, or stay closed")
    void productionIsFineWithRealPaymentsOrClosed() {
        assertThat(new BookingSwitch(true, true, profile("prod")).isOpen()).isTrue();
        assertThat(new BookingSwitch(false, false, profile("prod")).isOpen()).isFalse();
        assertThat(new BookingSwitch(false, true, profile("prod")).isOpen()).isFalse();
    }

    @Test
    @DisplayName("INC-072: development may book against the dummy gateway")
    void developmentMayUseDummyPayments() {
        assertThat(new BookingSwitch(true, false, profile("dev")).isOpen()).isTrue();
        assertThat(new BookingSwitch(true, false, new MockEnvironment()).isOpen()).isTrue();
    }

    @Test
    @DisplayName("INC-072: a closed switch refuses, an open one doesn't")
    void requireOpenFollowsTheSwitch() {
        assertThatThrownBy(() -> new BookingSwitch(false, false, profile("dev")).requireOpen())
                .isInstanceOf(BookingClosedException.class);
        assertThatCode(() -> new BookingSwitch(true, false, profile("dev")).requireOpen()).doesNotThrowAnyException();
    }
}
