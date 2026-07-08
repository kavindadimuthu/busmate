# Use an OpenJDK base image
FROM eclipse-temurin:17-jdk

# Set working directory inside container
WORKDIR /app

# Copy the jar file into the container
COPY target/*.jar app.jar

# Expose the port Spring Boot runs on
EXPOSE 9010

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
