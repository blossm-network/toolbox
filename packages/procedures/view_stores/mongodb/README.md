A view store server.

Ordinary ID-only writes can create a view. Writes with body query conditions or
positional update paths require an existing matching view and never upsert.
An unmatched conditional write returns no view, allowing the HTTP handler to
respond with 204. Array filters select elements independently of document queries.
