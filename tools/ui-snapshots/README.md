# UI snapshots

A fast visual review tool, not a test: one command captures a screenshot of every discovered screen across
BusMate's web frontends, so a human can review current UI state in a gallery instead of clicking through each
app by hand. No pass/fail, no diffing, no CI gate — see `intent/context.md` Conventions for why.

```
pnpm screenshots                            # everything, every web app
pnpm screenshots --app=new-react-portal     # one app only
pnpm screenshots --keep-stack               # leave the throwaway stack up for a quick re-run
pnpm screenshots --no-stack                 # reuse a stack left up by --keep-stack
pnpm screenshots --headed                   # watch it run, for debugging a login/route problem
```

Output lands in `output/<timestamp>/`, gitignored — `index.html` is the gallery, grouped by app and role,
mirroring the route tree (so it doubles as a visual sitemap).

## How routes are found

Never hand-listed. Each app in `apps.mjs` says *how* to discover its own routes from its own router, so a new
screen is captured automatically the moment it's added — this file needs no edit for that:

- `new-react-portal` is file-based routing; we glob `src/pages/**/page.tsx` the same way `App.tsx` itself does.
- `passenger-web` declares routes as JSX `<Route path="...">` literals in one file; we regex that file.

Dynamic routes (`/mot/operators/:operatorId`) are resolved at capture time by visiting the list page while
already logged in and picking up a real id from an actual link on it — not a hardcoded id anywhere. A route
that can't be resolved this way is skipped and reported in the gallery and console output, never guessed at.

In practice this only resolves dynamic routes in `passenger-web`. `new-react-portal`'s list pages are built
on the shared `ResourceListView` component (`libs/ui/src/resource/views/resource-list-view.tsx`), which
navigates to a detail page via `router.push()` from a row-action button's `onClick`, not a real `<a href>` —
so there's nothing for link-scraping to find. This tool deliberately does not fall back to "click the first
row-looking element": those same row actions often include delete/deactivate buttons, and a review tool
should never risk firing one against seeded data. Detail and edit pages for `new-react-portal` are skipped
and reported, not captured — everything else (dashboards, list pages, forms, all four staff roles) is.

## Infra

`stack.mjs` starts its own throwaway Postgres, user-service, core-service, api-gateway, and the two frontends,
each on ports distinct from your normal dev stack and from the (unmerged, INC-049) flow-test stack, so any of
the three can run at once. Test accounts come from user-service's Flyway dev seed, which runs automatically —
see `docs/dev-seed-credentials.md`.

## Known limits

- Mobile apps (conductor-mobile, passenger-mobile) aren't covered yet.
- `ticketing-service` isn't part of this stack, so screens that need it may render partial/empty data.
- Screens are captured in their default/seeded state, not every empty/error/edge-case state.
