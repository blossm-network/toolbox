A view store server.

Index keys are relative to the view body. MongoDB index options are preserved;
text weight keys are also relative to the body. Field paths inside other native
MongoDB options, such as partialFilterExpression or wildcardProjection, refer to
the stored document and therefore include body. where appropriate.


MongoDB enforces these constraints once the configured indexes initialize.

Partial-word text matching treats punctuation literally, not as regular-expression
syntax. The full-text branch retains MongoDB text-search syntax. Search still
depends on the configured indexes and database execution limits; escaping a
pattern does not make an unanchored partial-word search constant-cost.

Generated remote projections use [fenced projection plays](PROJECTION_SESSIONS.md).
Direct internal PUT/DELETE retain their existing semantics and do not participate
in the projection lease. Local mode keeps direct writes without replica-set or
session infrastructure.
