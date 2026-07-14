package com.busmatelk.backend.kafka;

import org.apache.kafka.clients.producer.ProducerRecord;
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
        ProducerRecord<String, String> record = new ProducerRecord<>("operator-events", operatorJson);
        KafkaCorrelation.stamp(record);
        kafkaTemplate.send(record);
    }

    private static final Logger logger = LoggerFactory.getLogger(OperatorProducer.class);
}
