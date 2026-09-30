# passenger-web is retired

Replaced on busmate.site by [`passenger-web-v2`](../passenger-web-v2) (ADR-029, INC-086). It is **kept in the repository**
so it can be brought back, but it is no longer built into the production image, served, or developed.

- **Bringing it back:** in `config/caddy/Dockerfile`, build `@busmate/passenger-web` instead of `@busmate/passenger-web-v2`
  (the install filter, the `.env.production.local` path, the build and the `COPY` of `dist`), then rebuild the `caddy`
  service. It still runs locally with `pnpm run dev:passenger-web`.
- **Deleting it:** a later, separate decision, after the flow tests that still drive it (`pnpm flows`) move to v2.
- Add nothing here.
