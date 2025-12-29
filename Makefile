# Makefile for Route Management Service
# This Makefile provides easy commands to run the Spring Boot application with different database configurations.
# You can override DDL_AUTO and INIT_MODE by setting them as environment variables, e.g.:
#   make DDL_AUTO=create INIT_MODE=always run-local

# Default target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  run-local    - Run with local PostgreSQL database"
	@echo "  run-prod     - Run with production Supabase database"
	@echo "  run-test     - Run with testing Supabase database"
	@echo "  run-aws      - Run with AWS RDS database"
	@echo "  build        - Build the application"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean build artifacts"
	@echo "  package      - Package the application"
	@echo "  help         - Show this help message"
	@echo "Override options:"
	@echo "  DDL_AUTO     - JPA Hibernate DDL auto mode (default: update)"
	@echo "                 Options: none/validate/update/create/create-drop"
	@echo ""
	@echo "  INIT_MODE    - SQL init mode (default: never)"
	@echo "                 Options: never/always/embedded"
	@echo "  Example: make DDL_AUTO=create INIT_MODE=always run-local"

# Configurable options (can be overridden)
DDL_AUTO ?= update
INIT_MODE ?= never

# Database configurations
LOCAL_URL = jdbc:postgresql://localhost:5432/sample
LOCAL_USERNAME = kavinda
LOCAL_PASSWORD = root

PROD_URL = jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?connectTimeout=10&socketTimeout=30&loginTimeout=10&prepareThreshold=0&preparedStatementCacheQueries=0&reWriteBatchedInserts=true&tcpKeepAlive=true&autoCommit=false
PROD_USERNAME = postgres.bixiyzllxffxqwutthmk
PROD_PASSWORD = root

TEST_URL = jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?connectTimeout=10&socketTimeout=30&loginTimeout=10&prepareThreshold=0&preparedStatementCacheQueries=0&reWriteBatchedInserts=true&tcpKeepAlive=true&autoCommit=false
TEST_USERNAME = postgres.viplrebpmygqlvruxucp
TEST_PASSWORD = LbGZQCRaSBblXaS7

AWS_URL = jdbc:postgresql://database-1.cjsy2ky4qv53.ap-southeast-1.rds.amazonaws.com:5432/busmateroute
AWS_USERNAME = postgres
AWS_PASSWORD = wZ6NUc2csD9HE6TJps6r

# Common Spring Boot run arguments
SPRING_ARGS = --spring.jpa.hibernate.ddl-auto=$(DDL_AUTO) --spring.sql.init.mode=$(INIT_MODE) --logging.level.com.busmate.routeschedule=INFO

# Run targets
.PHONY: run-local
run-local:
	mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=$(LOCAL_URL) --spring.datasource.username=$(LOCAL_USERNAME) --spring.datasource.password=$(LOCAL_PASSWORD) $(SPRING_ARGS)"

.PHONY: run-prod
run-prod:
	mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=$(PROD_URL) --spring.datasource.username=$(PROD_USERNAME) --spring.datasource.password=$(PROD_PASSWORD) $(SPRING_ARGS)"

.PHONY: run-test
run-test:
	mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=$(TEST_URL) --spring.datasource.username=$(TEST_USERNAME) --spring.datasource.password=$(TEST_PASSWORD) $(SPRING_ARGS)"

.PHONY: run-aws
run-aws:
	mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=$(AWS_URL) --spring.datasource.username=$(AWS_USERNAME) --spring.datasource.password=$(AWS_PASSWORD) $(SPRING_ARGS)"

# Build and test targets
.PHONY: build
build:
	mvn clean compile

.PHONY: test
test:
	mvn test

.PHONY: clean
clean:
	mvn clean

.PHONY: package
package:
	mvn clean package -DskipTests