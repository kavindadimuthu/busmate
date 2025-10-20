# UserManagementService

## Project Overview
Busmate is a comprehensive platform designed to streamline and digitize public transportation management. It aims to improve efficiency, security, and user experience for operators, conductors, passengers, and other stakeholders.

## Service Description
UserManagementService is a core backend service responsible for handling user registration, authentication, role management, and profile operations. It supports multiple user types, including passengers, conductors, finance officers, fleet operators, and more.

## Features
- User registration and authentication
- Role-based access control
- Profile management for various user types
- Password reset functionality
- Integration with Kafka for event-driven communication
- Secure JWT-based authentication

## Technologies Used
- Java 17+
- Spring Boot
- Spring Security
- Apache Kafka
- Maven
- Docker (optional)

## Getting Started
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Configure environment variables in `src/main/resources/application.properties` as needed.
4. Build and run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
5. Access the service at `http://localhost:8080` (default).

---
For more details, refer to the source code and documentation.
