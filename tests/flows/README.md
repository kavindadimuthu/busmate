# Flow tests

Real browsers against a real stack: Postgres, user-service, core-service, api-gateway, passenger-web and the
portal. They cover the two flows that matter most to the community programme — the contribution loop
(apply → accept → appoint steward → propose → review) and the timetable-post import.

```
pnpm flows                                   # fresh stack, every spec, stack removed afterwards
pnpm flows -- tests/flows/specs/timetable-import.spec.ts
pnpm flows:up / flows:down                   # keep a stack for poking at it (flows:test runs specs against it)
```

Needs Docker (a throwaway Postgres on :5544), Java/Maven, pnpm and Chrome (`PW_CHANNEL=chrome`).
`FLOWS_MVN_OFFLINE=1` builds the services without the network.

- **Isolated.** The stack has its own database and its own gateway on :8090, and touches nothing you run on
  :8080/:5432. It does need :9010, :9020, :4000 and :5173 free.
- **Ordered and destructive.** Specs change data (someone is accepted, a stop renamed), so each run needs a
  stack nobody has run against. `pnpm flows` guarantees that; running specs twice on one stack fails on
  purpose.
- **Not a substitute for backend tests.** Rules live in core-service's Testcontainers tests; these prove the
  screens, gateway and services agree.
