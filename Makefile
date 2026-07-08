gateway-dev:
	pnpm --filter api-gateway dev

gateway-build:
	pnpm --filter api-gateway build

up:
	docker compose up --build -d

down:
	docker compose down
