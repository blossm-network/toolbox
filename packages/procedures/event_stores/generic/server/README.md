An event store server.

## Durable publication contract

Every non-local adapter must provide `publishPendingFn`. Server composition rejects
an absent or nonfunction hook before constructing routes or listening. The generic
POST and block handlers use this required hook after their transactions commit;
there is no direct-publication fallback. Explicit local mode skips publication.

The adapter must persist pending notifications in the same database transaction
as newly accepted events. Use `@blossm/event-store-create-publication` to prepare
the shared notification format. A failed transaction must leave neither events nor
notices. Remove pending work only after publication acknowledges it; failures must
leave notices available to subsequent event or recurring block requests.

A hook's presence cannot prove atomic storage. Each adapter must verify rollback,
duplicate retry recovery and acknowledgment-before-delete against its database.
Delivery is at least once, and applications must handle duplicate notifications.
Recurring recovery calls remain required; no background worker is added.

Custom adapters that previously supplied only `publishFn` must implement this
contract before adopting this framework version. Do not substitute a no-op hook
or wrap direct publication without transactional persistence.
