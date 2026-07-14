package com.busmatelk.backend.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OperatorProducer {
    private final KafkaTemplate<String, String> kafkaTemplate;


    @Autowired
    public OperatorProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishOperatorCreated(String operatorJson) {
        logger.info("Publishing operator event to Kafka: {}", operatorJson);
        kafkaTemplate.send("operator-events", operatorJson);
    }

    private static final Logger logger = LoggerFactory.getLogger(OperatorProducer.class);
}
