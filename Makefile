gateway-dev:
	pnpm --filter api-gateway dev

gateway-build:
	pnpm --filter api-gateway build

core-dev:
	pnpm run dev:core-service

user-dev:
	pnpm run dev:user-service

ticketing-dev:
	pnpm run dev:ticketing-service

up:
	docker compose up --build -d

down:
	docker compose down

prod-up:
	docker compose -f docker-compose.production.yml up --build -d

prod-down:
	docker compose -f docker-compose.production.yml down
