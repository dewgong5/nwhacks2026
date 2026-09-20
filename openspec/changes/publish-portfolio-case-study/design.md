# Design

## Context

The active branch lacks a root README, while `afterhack` has a useful but deployment-stale README. Portfolio claims must reflect verified code, deployment, and ownership rather than roadmap intent.

## Goals / Non-Goals

**Goals:** communicate the product and modernization work quickly, with traceable evidence and honest limitations.

**Non-Goals:** turn planning artifacts into claims of completed work.

## Decisions

1. **Use an evidence ledger before writing claims.** Each material statement maps to repository, automated, browser, deployed, provider, or human evidence and names its date/version.
2. **Structure for scanning.** Hero summary, short demo, problem, central journey, architecture, modernization decisions, verification, tradeoffs, team attribution, and run-it-yourself path.
3. **Produce two diagrams.** Runtime/traffic and simulation/event flow; Compose is labeled demo deployment and Kubernetes is labeled learning environment.
4. **Keep the video short and captioned.** Script the deterministic flow, record one clean take plus degraded state, remove credentials/personal notifications, and provide poster/fallback media.
5. **Separate team hackathon work from later individual modernization.** Name collaborators and distinguish original versus subsequent contributions.

## Risks / Trade-offs

- [Documentation becomes stale] → version/date evidence and an update checklist.
- [Video hosting/link fails] → local poster/animated fallback and tested external link.
- [Claims overstate scale/security] → reviewer checklist against the evidence ledger.

## Migration Plan

Draft only evidenced sections; capture approved browser/deployment evidence; create diagrams; script/record/caption/compress video; update README and portfolio entry; run link/media/accessibility checks; obtain human review before publication. Revert publication independently without altering the application.
