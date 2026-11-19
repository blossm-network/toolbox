Builds the Mongoose schema for an event's transaction metadata (`tx`): the
caller's `ip` and `id`, the token `claims` and the procedure `path`.

It is the single owner of that shape. Every event-store adapter that validates
transaction metadata builds its schema here, so the bytes committed by `tHash`
are normalized identically.

```javascript
import mongoose from "mongoose";
import transactionSchema from "@blossm/event-transaction-schema";

const schema = new mongoose.Schema({
  tx: { type: transactionSchema(mongoose.Schema) },
});
```

The `Schema` constructor is passed in, so this package has no runtime
dependencies and the caller decides which Mongoose instance owns the schema.

- `claims.exp`, `claims.iat`, `claims.nbf`, `path[].issued` and
  `path[].timestamp` are stored as ISO 8601 strings. An unparseable date fails
  validation.
- `claims.aud` must be a string or an array of strings.
- Each `path` entry requires `network`, `host`, `procedure` and `hash`.
- `claims` and `path` entries keep undeclared fields. Undeclared top-level
  fields are stripped. Empty objects are kept.
