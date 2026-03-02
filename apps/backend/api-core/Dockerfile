# Use an OpenJDK base image
FROM openjdk:21-jdk

# Set working directory inside container
WORKDIR /app

# Copy the jar file into the container
COPY routeschedule-0.0.1-SNAPSHOT.jar app.jar

# Expose the port Spring Boot runs on
EXPOSE 8080

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
