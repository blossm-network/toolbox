# RPC delivery constants

```js
import { COMPLETED, QUEUED } from "@blossm/rpc-delivery-consts";
```

Named ESM constants for the optional RPC `delivery` field. `QUEUED` means the
queue accepted the request. `COMPLETED` means HTTP completed, which does not
itself prove that an event was committed. Event write outcomes have their own
`@blossm/event-outcome-consts` contract. Owning tests pin the serialized values.
