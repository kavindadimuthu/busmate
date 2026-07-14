FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 9030
ENTRYPOINT ["java", "-jar", "app.jar"]
