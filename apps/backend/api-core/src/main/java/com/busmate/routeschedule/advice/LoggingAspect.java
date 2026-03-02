package com.busmate.routeschedule.advice;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {
    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Before("execution(* com.busmate.routeschedule.controller..*(..))")
    public void logBeforeController(JoinPoint joinPoint) {
        logger.info("Entering method: {} with arguments: {}", joinPoint.getSignature(), joinPoint.getArgs());
    }

    @AfterReturning(pointcut = "execution(* com.busmate.routeschedule.controller..*(..))", returning = "result")
    public void logAfterController(JoinPoint joinPoint, Object result) {
        logger.info("Exiting method: {} with result: {}", joinPoint.getSignature(), result);
    }

    @AfterThrowing(pointcut = "execution(* com.busmate.routeschedule.controller..*(..))", throwing = "exception")
    public void logException(JoinPoint joinPoint, Exception exception) {
        logger.error("Exception in method: {} with message: {}", joinPoint.getSignature(), exception.getMessage());
    }
}