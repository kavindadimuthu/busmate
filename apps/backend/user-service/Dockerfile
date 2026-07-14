FROM eclipse-temurin:17-jdk
WORKDIR /app

# OpenTelemetry Java agent (Phase 6 observability, zero-code instrumentation). ADD lets
# the Docker daemon fetch it at build time — no curl/wget needed in this base image —
# and caches on the URL, so it's only re-downloaded when the pinned version changes.
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.10.0/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar

COPY target/*.jar app.jar
EXPOSE 9020
ENTRYPOINT ["java", "-javaagent:/otel/opentelemetry-javaagent.jar", "-jar", "app.jar"]
