Merges the contents of a file with a template.

## Local store databases

Each generated event store uses `service_domain`, and each generated view store
uses `context_name` (or `name` without a context). `src/database_name.js` owns
this rule for production build descriptions and local Compose services. Main
procedures and their dependencies therefore use separate destination databases
instead of sharing collections in `testing`.

The Mongo initialization script creates the fixture user in `admin` and grants
`readWrite` and `dbAdmin` only for the generated database list. The local daemon
retains its existing standalone setup and local infrastructure bypass. No data
migration or replica-set bootstrap is performed. Authorization remains disabled
in the generated daemon, so the roles configure the fixture user without
enforcing access restrictions.

Run the package test script through the normal Lerna workflow. Offline checks
render the actual build and Compose descriptions and execute the initialization
shell script through an isolated `mongosh` double to verify the resulting role
grant. They do not establish live Mongo, Docker or Cloud Build behavior.
