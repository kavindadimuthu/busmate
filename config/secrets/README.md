# Backend secrets & environment

This directory is the **single source of truth** for every backend service's
secrets and environment configuration. Before this existed, the same secrets
(`SUPABASE_JWT_SECRET`, `INTERNAL_API_KEY`, DB credentials) were duplicated
across a root `.env`, a per-service `.env`, and three committed
`application.yml` files — impossible to keep in sync and leaking real
credentials into git.

## Files

| File           | Committed? | Purpose                                             |
| -------------- | ---------- | --------------------------------------------------- |
| `.env`         | **No** (gitignored) | Real values used by all backend services locally. |
| `.env.example` | Yes        | Placeholder template. Copy to `.env` and fill in.   |
| `README.md`    | Yes        | This file.                                          |

## Setup

```bash
cp config/secrets/.env.example config/secrets/.env
# then edit config/secrets/.env with the real values
```

## How each service reads it

| Service                        | Mechanism (local dev)                          | Mechanism (Docker)              |
| ------------------------------ | ---------------------------------------------- | ------------------------------- |
| `api-gateway` (Node)           | `node --env-file=../../../config/secrets/.env` | `env_file:` in docker-compose   |
| `core-service` (Spring Boot)   | [spring-dotenv] reads `config/secrets/.env`    | `env_file:` in docker-compose   |
| `user-service` (Spring Boot)   | [spring-dotenv] reads `config/secrets/.env`    | `env_file:` in docker-compose   |
| `ticketing-service` (Spring)   | [spring-dotenv] reads `config/secrets/.env`    | `env_file:` in docker-compose   |

The Spring services point spring-dotenv at this directory via
`springdotenv.directory: ../../../config/secrets` in each `application.yml`
(resolved relative to the service's working directory). When the file is
absent (e.g. inside a container that gets its env from `env_file`),
spring-dotenv silently no-ops (`springdotenv.ignoreIfMissing` defaults to
`true`).

[spring-dotenv]: https://github.com/paulschwarz/spring-dotenv

## telemetry-service uses two database roles

Unlike the other services, `telemetry-service` connects as **two** database roles (INC-024, ADR-016):

| Variables | Role | Used for |
| --- | --- | --- |
| `TELEMETRY_DB_USERNAME` / `_PASSWORD` | restricted runtime role | Every request. Not a superuser, no `BYPASSRLS`, owns no tables. |
| `TELEMETRY_DB_MIGRATION_USERNAME` / `_PASSWORD` | table owner | Flyway migrations only. |

Row-level security keeps one operator's vehicle data invisible to another, but a superuser or table
owner bypasses it. The service therefore **refuses to start** if its runtime role is privileged.
Create the runtime role with `scripts/postgres/provision-telemetry-app-role.sql`; the password is
passed on the command line and is never committed in a migration.

## Why the variable names are service-scoped

Every backend service loads this **entire** file. The three Spring services
each use a **different** Supabase/Postgres database, so their credentials are
namespaced (`CORE_DB_*`, `USER_DB_*`, `TICKETING_DB_*`) rather than using the
generic `SPRING_DATASOURCE_*`.

> ⚠️ Do **not** add generic `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` or a
> shared `SERVER_PORT` here. Spring's relaxed binding would bind those into
> every service and point them all at the same database / port.

Port numbers and internal service URLs for Docker are **not** secrets and live
in the `docker-compose*.yml` files (per-service `environment:`), which override
the local-dev URL values from this file.

## Rotating a secret

Change it in **one place** — `config/secrets/.env` — then restart the affected
services. No other file needs editing.
