# @blossm/operation-hash

Returns the deployment/RPC identity suffix for an ordered operation tuple.

The default `OPERATION_IDENTITY_VERSION=1` preserves existing decimal names,
including the ambiguous concatenation of tuple components. Set the CLI process's
`OPERATION_IDENTITY_VERSION=2` explicitly to hash a JSON array of typed components
and prefix the decimal result with `v2-`. This distinguishes component boundaries,
undefined, null, empty strings and absent positions. Components are procedure
names/identifiers (strings and absent optional values), not arbitrary objects.

The `environment()` export returns the validated selector. CLI build/compose
configuration carries it into generated services and dependency containers so
RPC clients use the same naming rule. It overrides conflicting per-service env
values; select the version on the CLI process itself, not inside procedure env
configuration. All invocations targeting the new deployment, including test,
execute and replay, must use the same selector.

Version 2 retains the existing 32-bit string-hash digest and Cloud Run-compatible
suffix length. It fixes ambiguous tuple encoding, not all possible digest
collisions. Do not use this identifier as an authentication token or a
cryptographic commitment. Deployment naming uniqueness still needs inventory
checks, especially for a large number of operations.

## Activation and recovery

1. Inventory current Cloud Run names, local Compose hosts, token audiences,
   queues, subscriptions, schedules and service-to-service callers. Update all
   services to version-aware code while retaining version 1 first. The stream
   RPC must use operation-hash rather than the unrelated event-hash API.
2. Generate version 2 names in a separate environment and compare the actual
   CLI/Compose/RPC outputs before deployment. Nothing in this package changes
   existing cloud resources, aliases names, forwards traffic or rewrites queues.
3. Deploy and verify all version 2 targets, then switch coordinated callers and
   public routing. Drain old queues/retries or explicitly keep their version 1
   targets alive until drained; an old queued URL does not become a new one.
4. Retain version 1 services and configuration for rollback until the cutover is
   accepted. To roll back routing, use the recorded version 1 configuration and
   targets; do not delete them as part of enabling version 2.

Enabling the selector renames endpoints. This requires a deployment migration;
merging this source change does not activate version 2 on an existing service.
