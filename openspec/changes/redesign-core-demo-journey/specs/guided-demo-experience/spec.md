# Spec Delta

## Purpose

Defines an accessible, responsive portfolio journey that helps a first-time reviewer understand, run, inspect, and replay MarketMind within a short visit.

## ADDED Requirements

### Requirement: The experience guides first-time setup
Before a session starts, the interface SHALL explain the simulation, identify demo and live modes, and let the visitor choose or customize a strategy without exposing the dense live dashboard.

#### Scenario: First-time visitor opens the demo
- **WHEN** no session exists
- **THEN** the primary path presents a concise briefing, mode status, strategy selection, and one clear start action

### Requirement: Live information has a clear hierarchy
During a session, the interface MUST prioritize market movement, the current important event, the visitor agent's action and rationale, and relative performance above secondary feeds.

#### Scenario: Important news changes an agent decision
- **WHEN** a news event and related trade arrive
- **THEN** the UI visibly connects the event, affected asset, agent action, and available rationale without requiring the visitor to scan every panel

### Requirement: Agent decisions are explainable and accurately labeled
The interface SHALL provide an accessible explanation for supported agent actions and SHALL identify whether that explanation is deterministic, rule-derived, or live-provider-generated.

#### Scenario: Visitor opens trade rationale
- **WHEN** a rationale is available for an activity item
- **THEN** keyboard and pointer users can open a labelled explanation containing mode, signal, action, asset, and bounded summary

### Requirement: Every major operational state has a designed response
The interface MUST provide distinct loading, connected-idle, running, reconnecting, provider-unavailable, quota-exhausted, recoverable-error, completed, and empty states with an appropriate next action.

#### Scenario: Paid quota is exhausted
- **WHEN** a visitor attempts a paid feature after quota exhaustion
- **THEN** the UI explains the limit without exposing internals and offers deterministic mode when available

#### Scenario: WebSocket disconnects
- **WHEN** a running client loses its connection
- **THEN** the UI stops presenting data as live, shows recovery status, and offers a safe restart if recovery fails

### Requirement: Completion communicates the portfolio story
After a session, the interface SHALL summarize outcome, key turning point, visitor-agent behavior, mode, and limitations and SHALL offer replay and deeper analysis.

#### Scenario: Deterministic session completes
- **WHEN** the completion event is received
- **THEN** the summary clearly labels deterministic mode and exposes replay with the same scenario

### Requirement: The journey is accessible and responsive
The primary journey MUST support keyboard navigation, visible focus, semantic labels, sufficient contrast, reduced motion, and layouts usable at agreed mobile and laptop viewports.

#### Scenario: Reduced motion is enabled
- **WHEN** the operating system requests reduced motion
- **THEN** non-essential celebration and transition movement is removed without hiding state changes
