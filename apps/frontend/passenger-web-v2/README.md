# passenger-web-v2

Parallel rebuild of `passenger-web`, styled from a Claude Design reference, built up to parity before
it replaces the current app. See [ADR-029](../../../intent/decisions/ADR-029-passenger-web-v2-ships-parallel-until-it-reaches-parity.md),
[INC-063](../../../intent/increments/INC-063-passenger-web-v2-roadmap.md), and the
[design reference](../../../docs/ui/passenger-web-v2-design-reference.md).

Not linked from anywhere real yet. Same stack, same `api-gateway` wiring pattern, same component
base as `passenger-web` — see that app's own conventions for anything not covered here.

## Run it

```bash
pnpm run dev:passenger-web-v2   # http://localhost:4001
```

Needs the backend (`api-gateway` + at least `core-service`) running for anything beyond the shell to
work — see `docs/local-dev-quickstart.md` at the repo root.
