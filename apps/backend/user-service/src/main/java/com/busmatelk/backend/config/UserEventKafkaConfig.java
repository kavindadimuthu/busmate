package com.busmatelk.backend.config;

import com.busmatelk.backend.event.UserEvent;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * A producer scoped to just UserEvent, kept separate from the app's default
 * KafkaTemplate<String, String> (which OperatorProducer already uses for operator-events).
 * The plan's literal instruction was to set spring.kafka.producer.value-serializer to
 * JsonSerializer globally, but that property drives Spring Boot's autoconfigured default
 * KafkaTemplate bean — changing it would silently switch operator-events from raw strings
 * to JSON-quoted strings on the wire, which could break whatever already consumes that topic.
 *
 * Defining any KafkaTemplate bean here also makes Spring Boot's KafkaAutoConfiguration skip
 * creating its own default KafkaTemplate<String, String> bean — its
 * @ConditionalOnMissingBean(KafkaTemplate.class) check matches by raw type, and generics are
 * erased at runtime, so this class's UserEvent-typed bean satisfies that check. Confirmed this
 * empirically: OperatorProducer failed to start with "No qualifying bean of type
 * KafkaTemplate<String, String>" once userEventKafkaTemplate existed. So this class explicitly
 * re-creates that default bean too, alongside the UserEvent-specific one.
 */
@Configuration
public class UserEventKafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ProducerFactory<String, String> defaultProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        applyFailFastTimeouts(configProps);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate(ProducerFactory<String, String> defaultProducerFactory) {
        return new KafkaTemplate<>(defaultProducerFactory);
    }

    @Bean
    public ProducerFactory<String, UserEvent> userEventProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        applyFailFastTimeouts(configProps);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    /**
     * Every publish call happens synchronously on the request thread (see UserEventPublisher),
     * and is already best-effort (catches and logs failures) — so a broker outage should fail
     * in a few seconds, not block the caller for the client default of 60s per attempt.
     */
    private void applyFailFastTimeouts(Map<String, Object> configProps) {
        configProps.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 3000);
        configProps.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 3000);
        configProps.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 5000);
    }

    @Bean
    public KafkaTemplate<String, UserEvent> userEventKafkaTemplate(ProducerFactory<String, UserEvent> userEventProducerFactory) {
        return new KafkaTemplate<>(userEventProducerFactory);
    }
}
