# Design

## Context

`Index.tsx` currently renders chart, controls, agent board, trader panel, consultant, market board, and activity feed with similar emphasis. Profile creation is modal and operational states are distributed across components.

## Goals / Non-Goals

**Goals:** create a coherent first-use narrative with accessible state transitions and visual acceptance at real viewports.

**Non-Goals:** redesign every shadcn primitive or fabricate portfolio claims.

## Decisions

1. **Use a four-stage journey:** briefing/strategy, market opening, live arena, outcome/analysis. A small state machine makes transitions and recovery explicit.
2. **Use progressive disclosure.** Primary canvas shows chart, pivotal event, visitor agent decision, and rank; secondary market/agent details move into tabs/drawers below the fold.
3. **Build mode provenance into visible chrome.** A persistent badge and result metadata distinguish deterministic and live modes.
4. **Treat operational states as first-class views.** Disconnection, quota, unavailable provider, and empty rationale have designed copy and actions, not generic toasts.
5. **Use tokens and a restrained motion system.** Retain game energy with one accent, clear financial semantics, and reduced-motion equivalents.
6. **Validate with component tests plus real browser captures.** Desktop, laptop, and mobile widths; keyboard flow; contrast; reduced motion; and the full timed journey are separate gates.

## Risks / Trade-offs

- [Hiding detail weakens technical impression] → secondary inspection remains available without dominating the first journey.
- [Animation delays demo] → motion is short, interruptible, and disabled under reduced motion.
- [Backend contracts change concurrently] → fixture-driven UI adapters and a versioned event contract.

## Migration Plan

Inventory states/content; define journey/state model and tokens; build briefing shell; recompose live hierarchy; add rationale and completion; implement failure states; run automated accessibility checks; capture and review real browser evidence before replacing the current layout.
