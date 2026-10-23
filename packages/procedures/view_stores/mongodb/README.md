A view store server.

Index keys are relative to the view body. MongoDB index options are preserved;
text weight keys are also relative to the body. Field paths inside other native
MongoDB options, such as partialFilterExpression or wildcardProjection, refer to
the stored document and therefore include body. where appropriate.

Introducing unique indexes can fail if existing data contains duplicates. Inspect
and migrate the data/indexes before activating new constraints in production.
