package com.busmate.routeschedule.fleet;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.licensing.entity.PassengerServicePermit;
import com.busmate.routeschedule.licensing.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.support.OperationsFixtures;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

/** INC-018 against real Postgres and a real MinIO. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-018 bus profiles")
class BusProfileIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final String BUCKET = "test-bus-media";

    @SuppressWarnings("resource")
    static final GenericContainer<?> MINIO =
            new GenericContainer<>("bitnamilegacy/minio:2025.7.23-debian-12-r3")
                    .withEnv("MINIO_ROOT_USER", "testaccesskey")
                    .withEnv("MINIO_ROOT_PASSWORD", "testsecretkey")
                    .withExposedPorts(9000)
                    .waitingFor(Wait.forHttp("/minio/health/live").forPort(9000));

    static {
        MINIO.start();
    }

    @DynamicPropertySource
    static void mediaProperties(DynamicPropertyRegistry registry) {
        registry.add("media.s3.endpoint", () -> "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000));
        registry.add("media.s3.access-key", () -> "testaccesskey");
        registry.add("media.s3.secret-key", () -> "testsecretkey");
        registry.add("media.s3.bucket", () -> BUCKET);
    }

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private S3Client s3;
    @Autowired private ObjectMapper json;

    private MockMvc mvc;
    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private Operator operatorA;
    private Operator operatorB;

    @BeforeEach
    void setUp() {
        try {
            s3.createBucket(CreateBucketRequest.builder().bucket(BUCKET).build());
        } catch (BucketAlreadyOwnedByYouException ignored) {
            // shared container
        }
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        operatorA = fx.operator("A", userA);
        operatorB = fx.operator("B", userB);
    }

    private String fleet(Operator operator) {
        return "/api/v1/bus-operator/" + operator.getId() + "/buses";
    }

    /** 3 rows of 2+2 plus a back row of 3 = 15 seats. */
    private static String layout15() {
        return "{\"layoutName\":\"Custom 15\",\"rows\":["
                + "{\"left\":[\"1\",\"2\"],\"right\":[\"3\",\"4\"]},"
                + "{\"left\":[\"5\",\"6\"],\"right\":[\"7\",\"8\"]},"
                + "{\"left\":[\"9\",\"10\"],\"right\":[\"11\",\"12\"]},"
                + "{\"back\":[\"13\",\"14\",\"15\"]}],\"blockedSeats\":[\"2\"]}";
    }

    private static String busJson(String plate, int capacity, String layout) {
        return "{\"ntcRegistrationNumber\":\"NTC-" + plate + "\",\"plateNumber\":\"" + plate + "\",\"capacity\":" + capacity
                + ",\"model\":\"Rosa\",\"serviceClass\":\"LUXURY\",\"manufactureYear\":2019,\"chassisNumber\":\"CH-1\","
                + "\"facilities\":{\"ac\":true,\"wifi\":false}"
                + (layout != null ? ",\"seatLayout\":" + layout : "") + "}";
    }

    @Test
    @DisplayName("INC-018 an operator registers a bus with its own seat layout and facilities")
    void inc018_registerWithLayout() throws Exception {
        mvc.perform(post(fleet(operatorA)).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(busJson(" sp new-" + OperationsFixtures.shortId(), 15, layout15())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.operatorId").value(operatorA.getId().toString()))
                .andExpect(jsonPath("$.plateNumber").value(containsString("SP NEW-")))
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.availability").value("AVAILABLE"))
                .andExpect(jsonPath("$.availableToday").value(true))
                .andExpect(jsonPath("$.seatLayout.rows", hasSize(4)))
                .andExpect(jsonPath("$.seatLayout.blockedSeats[0]").value("2"))
                .andExpect(jsonPath("$.facilities.ac").value(true))
                .andExpect(jsonPath("$.manufactureYear").value(2019));
    }

    @Test
    @DisplayName("INC-018 a seat layout that disagrees with capacity or repeats a seat is refused")
    void inc018_invalidLayoutsRefused() throws Exception {
        mvc.perform(post(fleet(operatorA)).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(busJson("X-" + OperationsFixtures.shortId(), 16, layout15())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("15 seats but the capacity is 16")));
        String duplicate = "{\"rows\":[{\"left\":[\"1\",\"1\"]}]}";
        mvc.perform(post(fleet(operatorA)).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(busJson("Y-" + OperationsFixtures.shortId(), 2, duplicate)))
                .andExpect(status().isBadRequest());
        String strayBlocked = "{\"rows\":[{\"left\":[\"1\",\"2\"]}],\"blockedSeats\":[\"9\"]}";
        mvc.perform(post(fleet(operatorA)).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(busJson("Z-" + OperationsFixtures.shortId(), 2, strayBlocked)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("INC-018 an operator cannot register or edit a bus for another operator")
    void inc018_ownFleetOnly() throws Exception {
        mvc.perform(post(fleet(operatorB)).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(busJson("Q-" + OperationsFixtures.shortId(), 15, layout15())))
                .andExpect(status().isForbidden());
        Bus theirs = fx.bus(operatorB, ServiceClassEnum.LUXURY);
        mvc.perform(put(fleet(operatorA) + "/" + theirs.getId()).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(busJson(theirs.getPlateNumber(), 15, layout15())))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/buses/" + theirs.getId() + "/media").with(as(userA, "OPERATOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-018 availability is a dated window, separate from registration status")
    void inc018_availabilityWindow() throws Exception {
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        mvc.perform(put("/api/buses/" + bus.getId() + "/availability").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"availability\":\"UNDER_MAINTENANCE\",\"until\":\"" + LocalDate.now().plusDays(3) + "\",\"note\":\"Gearbox\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availability").value("UNDER_MAINTENANCE"))
                .andExpect(jsonPath("$.availableToday").value(false))
                .andExpect(jsonPath("$.status").value("active"));
        mvc.perform(put("/api/buses/" + bus.getId() + "/availability").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"availability\":\"OFF_ROAD\",\"from\":\"" + LocalDate.now().plusDays(10) + "\"}"))
                .andExpect(jsonPath("$.availableToday").value(true));
        mvc.perform(put("/api/buses/" + bus.getId() + "/availability").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"availability\":\"AVAILABLE\"}"))
                .andExpect(jsonPath("$.availabilityFrom").doesNotExist());
    }

    @Test
    @DisplayName("INC-018 retiring a bus ends its permit links and freezes its profile")
    void inc018_retire() throws Exception {
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        PassengerServicePermit permit = fx.permit(operatorA, fx.routeGroup(), PassengerServicePermitTypeEnum.NORMAL, 2);
        fx.link(bus, permit);
        mvc.perform(post("/api/buses/" + bus.getId() + "/retire").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Sold\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cancelled"))
                .andExpect(jsonPath("$.statusReason").value("Sold"));
        mvc.perform(get("/api/buses/" + bus.getId() + "/permit-links").with(as(userA, "OPERATOR")))
                .andExpect(jsonPath("$[0].inForce").value(false));
        mvc.perform(put(fleet(operatorA) + "/" + bus.getId()).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(busJson(bus.getPlateNumber(), 49, null)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-018 only MOT can suspend and reinstate a bus")
    void inc018_motSuspends() throws Exception {
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        mvc.perform(post("/api/buses/" + bus.getId() + "/suspend").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"x\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/buses/" + bus.getId() + "/suspend").with(as(UUID.randomUUID(), "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Failed inspection\"}"))
                .andExpect(jsonPath("$.status").value("inactive"))
                .andExpect(jsonPath("$.availableToday").value(false));
        mvc.perform(post("/api/buses/" + bus.getId() + "/reinstate").with(as(UUID.randomUUID(), "MOT")))
                .andExpect(jsonPath("$.status").value("active"));
    }

    @Test
    @DisplayName("INC-018 photos: first is the cover, the cover can move, and deleting it promotes the next")
    void inc018_photoGallery() throws Exception {
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        String first = uploadPhoto(bus, Color.RED);
        String second = uploadPhoto(bus, Color.BLUE);
        mvc.perform(get("/api/buses/" + bus.getId() + "/media").with(as(userA, "OPERATOR")))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].cover").value(true))
                .andExpect(jsonPath("$[1].cover").value(false));

        mvc.perform(patch("/api/buses/" + bus.getId() + "/media/" + second).with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cover\":true}"))
                .andExpect(jsonPath("$.cover").value(true));
        mvc.perform(get("/api/buses/" + bus.getId()).with(as(userA, "OPERATOR")))
                .andExpect(jsonPath("$.coverPhotoId").value(second))
                .andExpect(jsonPath("$.photoCount").value(2));

        mvc.perform(delete("/api/buses/" + bus.getId() + "/media/" + second).with(as(userA, "OPERATOR")))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/buses/" + bus.getId()).with(as(userA, "OPERATOR")))
                .andExpect(jsonPath("$.coverPhotoId").value(first));

        mvc.perform(get("/api/buses/" + bus.getId() + "/media/" + first + "/content").with(as(UUID.randomUUID(), "MOT")))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/jpeg"));
    }

    @Test
    @DisplayName("INC-018 documents: PDF or image, typed, with an expiry, served as a sandboxed attachment")
    void inc018_documents() throws Exception {
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        byte[] pdf = "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF".getBytes(StandardCharsets.US_ASCII);
        MvcResult result = mvc.perform(multipart("/api/buses/" + bus.getId() + "/media")
                        .file(new MockMultipartFile("file", "insurance.pdf", "application/pdf", pdf))
                        .param("kind", "DOCUMENT").param("documentType", "INSURANCE")
                        .param("expiryDate", LocalDate.now().minusDays(1).toString())
                        .with(as(userA, "OPERATOR")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.expired").value(true))
                .andReturn();
        String id = json.readTree(result.getResponse().getContentAsString()).get("id").asText();
        mvc.perform(get("/api/buses/" + bus.getId() + "/media/" + id + "/content").with(as(userA, "OPERATOR")))
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Security-Policy", "sandbox"));

        mvc.perform(multipart("/api/buses/" + bus.getId() + "/media")
                        .file(new MockMultipartFile("file", "x.pdf", "application/pdf", pdf))
                        .param("kind", "DOCUMENT")
                        .with(as(userA, "OPERATOR")))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/buses/" + bus.getId() + "/media")
                        .file(new MockMultipartFile("file", "x.txt", "text/plain", "hello".getBytes(StandardCharsets.UTF_8)))
                        .param("kind", "PHOTO")
                        .with(as(userA, "OPERATOR")))
                .andExpect(status().isBadRequest());
    }

    private String uploadPhoto(Bus bus, Color color) throws Exception {
        MvcResult result = mvc.perform(multipart("/api/buses/" + bus.getId() + "/media")
                        .file(new MockMultipartFile("file", "bus.png", "image/png", png(color)))
                        .param("kind", "PHOTO").param("title", "Front")
                        .with(as(userA, "OPERATOR")))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        return body.get("id").asText();
    }

    private static byte[] png(Color color) throws IOException {
        BufferedImage image = new BufferedImage(32, 24, BufferedImage.TYPE_INT_RGB);
        var g = image.createGraphics();
        g.setColor(color);
        g.fillRect(0, 0, 32, 24);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private static RequestPostProcessor as(UUID userId, String role) {
        return user(userId.toString()).roles(role);
    }
}
