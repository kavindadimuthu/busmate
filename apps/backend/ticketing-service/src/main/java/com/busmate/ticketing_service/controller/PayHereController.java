package com.busmate.ticketing_service.controller;

import com.busmate.ticketing_service.dto.request.PayHereHashRequestDTO;
import com.busmate.ticketing_service.dto.response.PayHereHashResponseDTO;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.payhere.PayHereHashService;
import com.busmate.ticketing_service.payhere.PayHereProperties;
import com.busmate.ticketing_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * INC-008: conductor-collected card payments via PayHere's mobile SDK. Two endpoints, both
 * unrelated to the existing PaymentGateway abstraction (that model is a redirect+webhook flow
 * for passenger self-booking; here the conductor's app completes the payment synchronously
 * in-app and only needs a hash beforehand and a reconciliation hook afterward).
 *
 * /hash requires the conductor's own auth (routed through api-gateway with requiresAuth=true).
 * /notify is PayHere's own server calling us directly - it cannot present a BusMate JWT, so it
 * must be routed unauthenticated at the gateway; its md5sig IS the authentication.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/payhere")
@RequiredArgsConstructor
public class PayHereController {

    private final PayHereHashService hashService;
    private final PayHereProperties properties;
    private final PaymentService paymentService;

    private static final String CURRENCY = "LKR";

    @PostMapping("/hash")
    public ResponseEntity<PayHereHashResponseDTO> getHash(@RequestBody PayHereHashRequestDTO request) {
        if (request.getOrderId() == null || request.getOrderId().isBlank()) {
            throw new BadRequestException("orderId is required");
        }
        if (request.getAmount() == null || request.getAmount().signum() <= 0) {
            throw new BadRequestException("amount must be positive");
        }

        String hash = hashService.generateCheckoutHash(request.getOrderId(), request.getAmount(), CURRENCY);

        return ResponseEntity.ok(new PayHereHashResponseDTO(
                properties.getMerchantId(),
                request.getOrderId(),
                request.getAmount(),
                CURRENCY,
                hash,
                properties.isSandbox()));
    }

    /**
     * PayHere posts this as application/x-www-form-urlencoded, not JSON - bound as individual
     * @RequestParam fields rather than a DTO so unexpected/extra fields never break binding.
     */
    @PostMapping(value = "/notify", consumes = "application/x-www-form-urlencoded")
    public ResponseEntity<String> notify(
            @RequestParam("merchant_id") String merchantId,
            @RequestParam("order_id") String orderId,
            @RequestParam(value = "payment_id", required = false) String paymentId,
            @RequestParam("payhere_amount") String payhereAmount,
            @RequestParam("payhere_currency") String payhereCurrency,
            @RequestParam("status_code") String statusCode,
            @RequestParam("md5sig") String md5sig) {

        boolean verified = hashService.verifyNotifySignature(
                orderId, payhereAmount, payhereCurrency, statusCode, merchantId, md5sig);

        if (!verified) {
            log.warn("[PayHere notify] signature mismatch for order {} - ignoring, not from PayHere", orderId);
            // Respond 200 regardless: PayHere retries on non-2xx, and a forged/replayed call
            // doesn't deserve a retry loop hint either way.
            return ResponseEntity.ok("ignored");
        }

        log.info("[PayHere notify] order={} paymentId={} statusCode={}", orderId, paymentId, statusCode);
        paymentService.applyPayHereNotification(orderId, Integer.parseInt(statusCode));

        return ResponseEntity.ok("OK");
    }
}
