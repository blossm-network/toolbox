A view store server DELETE handler.

Deletion requires an ID or a nonempty body query. Contextual stores additionally
require their configured context and include it in the persistence selector.
The Mongo adapter deletes at most one matching view, not a whole collection.
