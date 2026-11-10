# View-store mutations

Internal view write and removal operations shared by HTTP and transaction adapters. Callers own authentication, authorization and input validation. Writes retain the existing behavior of mapping a supplied context without requiring one; removal requires the configured context and an ID or nonempty query.

`write({ writeFn, formatFn, updateFn, updateKeys })({ id, body })` maps the update, raw body conditions, context, groups and trace into persistence arguments. `writeFn({ query, data, arrayFilters })` returns the persisted view or no result. The operation returns `{ view, keys? }`, or `undefined` when nothing matched. `formatFn` receives `{ body, id, created, modified }`; optional `updateFn` transforms the submitted update before mapping.

`remove({ removeFn })({ id, query, context })` calls `removeFn(query)` with the mapped selector and returns `{ deletedCount }` from persistence.

Mongo connection, transaction/session, index and conditional upsert policy stay in the persistence adapter. This library does not send HTTP responses: PUT maps no result to 204 and a result to 200, while DELETE sends its count with 200. Persistence and application callback errors propagate unchanged.
