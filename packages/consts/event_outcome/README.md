# Event outcome constants

Named ESM constants for event-write outcomes, following the existing
`@blossm/duration-consts` and `@blossm/service-name-consts` convention.

```js
import { COMMITTED } from "@blossm/event-outcome-consts";

const thenFn = async ({ outcomes }) => {
  if (outcomes[0].status !== COMMITTED) return;
  return upgradeSession();
};
```

Exports: `COMMITTED`, `DUPLICATE`, `QUEUED`, `UNKNOWN`. These are stable wire
values, shared by event stores, command handlers and application consumers.
`QUEUED` is an event's unconfirmed write outcome; transport-level delivery uses
`@blossm/rpc-delivery-consts` instead. Owning tests pin the serialized values.
