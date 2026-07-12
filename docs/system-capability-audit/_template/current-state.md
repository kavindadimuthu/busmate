# S{N} — Current State

> **Capture stage.** How this section is *built* today: structure, data model, lifecycle, API
> surface. Describe reality, not intentions — link `file:line`. No gap analysis here (that lives in
> `gaps-and-improvements.md`); just note "⚠ see G-S{N}-xx" inline where a diagram shows something
> that is a known issue.

## Architecture / component structure

```mermaid
classDiagram
    %% Controllers → services → repositories, plus the domain entities they touch.
    %% Show fields + key methods; mark cross-service references with a note.
```

Narrative: what the components are and how a request flows through them.

## Data model

```mermaid
erDiagram
    %% Tables/entities for this section and their relations.
```

## Lifecycle / state machine (if applicable)

```mermaid
stateDiagram-v2
    %% Only the transitions the code actually performs. Note unguarded/dead transitions.
```

## API surface

| Method + path | Purpose | Auth / scope | Notes |
|---|---|---|---|
| `GET /api/...` | … | public / role / ownership | … |
