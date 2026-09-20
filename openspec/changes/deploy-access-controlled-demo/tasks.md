# Tasks

## 1. Authorized Infrastructure Plan

- [ ] 1.1 Select host, hostname, edge/access provider, public deterministic policy, retention, and budget with the user; verify explicit authorization before creating resources or changing DNS.
- [ ] 1.2 Produce firewall/tunnel, identity validation, secrets, backup, monitoring, release, and rollback runbooks; verify threat review covers origin bypass and paid-route denial.

## 2. Provision and Deploy

- [ ] 2.1 Provision the authorized host with least-privilege operator/runtime access and automatic security updates as agreed; verify only intended management and edge paths are reachable.
- [ ] 2.2 Install the identified Compose image set and external runtime configuration without exposing secrets; verify health/readiness before public routing.
- [ ] 2.3 Configure HTTPS edge/tunnel, DNS, origin restrictions, trusted proxy settings, and HTTP/WebSocket routing; verify direct origin/internal ports are denied and no mixed content occurs.
- [ ] 2.4 Configure access policy so paid routes require approved identity and deterministic access follows the chosen policy; verify allow and deny cases before provider calls.
- [ ] 2.5 Configure monitoring, resource/provider alerts, redacted logs, certificate checks, and paid-feature kill switch; verify alert delivery and kill-switch behavior.

## 3. Release Evidence and Rollback

- [ ] 3.1 Run real-host HTTP, API, WebSocket, deterministic completion, denial, quota, timeout, and restart smoke checks; record deployed evidence with image/version identifiers.
- [ ] 3.2 Perform a separately authorized minimal real-provider check under a tiny quota; verify provider evidence without treating it as general availability proof.
- [ ] 3.3 Complete real-browser responsive/accessibility journey and explicit human demo acceptance; record these separately from infrastructure checks.
- [ ] 3.4 Exercise rollback to the prior image/config set and restore the candidate only if approved; verify both transitions retain access boundaries.
- [ ] 3.5 Update the runbook with final host-neutral procedures and known limitations; run strict OpenSpec validation without embedding live endpoints or secrets in planning artifacts.
