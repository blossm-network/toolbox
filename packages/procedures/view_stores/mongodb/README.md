A view store server.

Ordinary ID-only writes can create a view. Writes with body query conditions or
positional update paths require an existing matching view and never upsert.
An unmatched conditional write returns no view, allowing the HTTP handler to
respond with 204. Array filters select elements independently of document queries.

Index keys and text weight keys are relative to the view body. MongoDB index
options are preserved. Field paths inside other native options, such as
partialFilterExpression or wildcardProjection, refer to the stored document and
therefore include body. where appropriate. MongoDB enforces these constraints
once the configured indexes initialize.

An explicit single-field ascending index takes precedence over an automatically
generated partial-word search helper on the same field. Its configured constraints
and options are retained.

Partial-word text matching treats punctuation literally, not as regular-expression
syntax. The full-text branch retains MongoDB text-search syntax. Search still
depends on the configured indexes and database execution limits; escaping a
pattern does not make an unanchored partial-word search constant-cost.
