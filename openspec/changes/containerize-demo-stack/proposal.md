# Proposal

## Why

The project currently relies on manually launched Python and Vite processes with environment-specific URLs. Reproducible containers are needed for a credible demo deployment and as the prerequisite for later Kubernetes learning work.

## What Changes

- Add production-oriented multi-stage images for the frontend/reverse proxy and FastAPI backend.
- Run application processes as non-root users with minimal build contexts and no embedded secrets.
- Add development and production Compose configurations for frontend proxy, backend, and Redis.
- Route HTTP and WebSocket traffic through one same-origin HTTPS-ready proxy boundary.
- Add health/readiness checks, restart behavior, resource bounds, persistent-data decisions, and deterministic local smoke tests.
- Document image build, startup, shutdown, configuration, backup/non-persistence, and troubleshooting workflows.

### Non-goals

- No cloud deployment, DNS/TLS mutation, Kubernetes resources, autoscaling, multi-replica backend, or application redesign.
- No claim that local container success proves production readiness.

### Change dependencies

- Depends on `restore-repository-quality-baseline` and stable backend/configuration boundaries from `modularize-and-test-backend`; protected AI configuration must remain secret-safe.

## Capabilities

### New Capabilities

- `containerized-demo-runtime`: Reproducible, non-root, health-checked Compose runtime for frontend proxy, backend, and Redis with safe configuration injection.

### Modified Capabilities

- None.

## Impact

Adds Dockerfiles, ignore files, Compose definitions, proxy configuration, container health endpoints, environment documentation, and smoke scripts. It may adjust frontend URL construction and backend proxy/header configuration.
