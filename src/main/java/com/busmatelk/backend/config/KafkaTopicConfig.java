//package com.busmatelk.backend.config;
//
//import org.apache.kafka.clients.admin.NewTopic;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.kafka.config.TopicBuilder;
//
//@Configuration
//public class KafkaTopicConfig {
//
//    @Value("${spring.kafka.template.default-topic}")
//    private String topicName;
//
//    @Bean
//    public NewTopic requestConductorDetailsTopic() {
//        return TopicBuilder.name(topicName).build();
//    }
//
////    @Bean
////    public NewTopic responseConductorDetailsTopic() {
////        return TopicBuilder.name().build();
////    }
//}
