# Use an OpenJDK base image
FROM eclipse-temurin:17-jdk

# Set working directory inside container
WORKDIR /app

# OpenTelemetry Java agent (Phase 6 observability, zero-code instrumentation). ADD lets
# the Docker daemon fetch it at build time — no curl/wget needed in this base image —
# and caches on the URL, so it's only re-downloaded when the pinned version changes.
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.10.0/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar

# Copy the jar file into the container
COPY target/*.jar app.jar

# Expose the port Spring Boot runs on
EXPOSE 9010

# Run the jar file
ENTRYPOINT ["java", "-javaagent:/otel/opentelemetry-javaagent.jar", "-jar", "app.jar"]
