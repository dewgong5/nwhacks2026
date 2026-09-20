# Design

## Context

The `afterhack` README describes an Oracle VM exposed over raw HTTP with Nginx and a tmux backend. The intended portfolio deployment needs HTTPS, hidden origin services, access policy, monitoring, and controlled paid-feature exposure.

## Goals / Non-Goals

**Goals:** a low-maintenance single-host deployment with defense in depth and reversible releases.

**Non-Goals:** high availability or Kubernetes production.

## Decisions

1. **Deploy immutable Compose images on one small host.** This matches scale and keeps operations understandable.
2. **Place an identity-aware edge/tunnel before the origin.** Preferred shape hides the origin and terminates TLS; if direct DNS is used, firewall only the proxy and validate edge JWTs at origin.
3. **Split public deterministic and protected paid paths by policy.** Default paid endpoints always require identity. Whether deterministic UI is public is a deploy-time policy documented in the runbook.
4. **Use release directories/image tags and health-gated switching.** Preserve the prior known-good configuration for rollback.
5. **Monitor outcomes, not payloads.** External uptime, internal health, container resources, access denials, quota/provider usage, and certificate expiry are sufficient.
6. **Provide a runtime kill switch.** Disable paid providers/configuration while leaving deterministic mode reachable.

## Risks / Trade-offs

- [Identity wall reduces recruiter conversion] → public deterministic mode plus video/case study; paid mode remains protected.
- [Tunnel/edge outage hides healthy origin] → documented diagnosis and no unsafe direct-origin bypass.
- [Single host fails] → acceptable for portfolio scope; backups/config and quick redeploy are the recovery strategy.

## Migration Plan

Select host/domain/access provider with user approval; provision least-privilege host; deploy images without DNS cutover; configure firewall/tunnel/TLS; configure policies/secrets/alerts; run real-host acceptance; cut over; retain old deployment until observation window passes. Roll back DNS/tunnel route and image set independently.
