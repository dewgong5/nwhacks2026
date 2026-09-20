# Design

## Context

The learning deployment follows working OCI images and Compose behavior. Backend simulation/session state is process-local, so horizontal backend scaling is unsafe. The Kubernetes project recommends Gateway API for new routing designs, while local distributions may require an ingress fallback.

## Goals / Non-Goals

**Goals:** teach declarative workloads, networking, probes, resources, policy, rollout/rollback, and diagnosis with a reproducible local cluster.

**Non-Goals:** claim production necessity or introduce cloud spend.

## Decisions

1. **Choose `k3d` as the primary local target with Kustomize.** It is lightweight and image-loading friendly; Kustomize keeps base/overlay mechanics visible. `kind` is an acceptable documented alternative only if compatibility is verified.
2. **Use a dedicated namespace and three workloads.** Frontend/proxy and backend Deployments; Redis StatefulSet or single Deployment with explicitly disposable local storage.
3. **Use Gateway API when supported.** Provide an overlay for the selected local controller; WebSocket routing is explicitly tested.
4. **Keep backend replicas at one.** Frontend scaling may be demonstrated; backend HPA remains disabled until shared session coordination exists.
5. **Commit secret interfaces, not values.** Local ignored secret generation or an external secret command supplies credentials.
6. **Add policies and observability exercises.** Default-deny plus required flows, resource inspection, logs/events, pod deletion, dependency outage, bad rollout, rollback, and teardown.

## Risks / Trade-offs

- [Local controller complexity obscures learning] → pin one supported stack and automate bootstrap.
- [NetworkPolicy support varies] → verify selected CNI and report unsupported behavior explicitly.
- [Redis persistence suggests production durability] → label storage disposable and document production differences.

## Migration Plan

Verify container contracts; pin cluster/controller versions; create base resources; add local overlay/routing; add secret bootstrap; add policies/resources/probes; script verification and failure labs; document teardown and evidence. No public cutover is part of this change.
