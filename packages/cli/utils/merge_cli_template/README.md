Merges the contents of a file with a template.

## Local Mongo fixtures

Generated Compose fixtures use the same database identities as production:
`service_domain` for event stores and `context_name` (or `name`) for view stores.
The rule lives in `src/write_compose/database_name.js`. Main procedures,
dependencies and the fixture user's exact database role list reuse it. Separate
view destinations therefore have separate `views`, `projection_control` and
`projection_receipts` collections instead of sharing a `testing` database.

The database service starts a single-node `blossm-test` replica set, advertised
as `mongodb:27017` on the Compose network. Store clients wait for its health
check to report a writable primary with their fixture user initialized. Other
procedure dependencies retain ordinary service-start ordering.

The mounted `mongodb-init.sh` deliberately does nothing when sourced by the
image entrypoint. Its explicit `ready` action refuses to run while the official
image's temporary initialization PID file exists. Only after that temporary
server exits does the health check initialize the final replica set, wait for
primary election and create or reconcile the fixture user's `readWrite` and
`dbAdmin` roles for the generated database list. This avoids initializing a
replica set against the image's temporary loopback bootstrap server. See the
[official Mongo 8 entrypoint](https://github.com/docker-library/mongo/blob/master/8.0/docker-entrypoint.sh)
and [Compose health dependency behavior](https://docs.docker.com/compose/how-tos/startup-order/).

This is an isolated local fixture, not a production database deployment. It
retains the existing no-auth container setup and known fixture credentials;
the host port binds to loopback, and other containers on the private Compose
network can reach it. Authorization is disabled in the generated daemon, so its
configured database roles do not enforce access restrictions. Exact role grants
are prepared for the named databases, without any `*AnyDatabase` role. Use fresh fixture data when changing
the configured stores; no production database or existing application data is
migrated by this generator.

Run the offline generator checks with the package's Lerna test command. With
MongoDB 8 and `mongosh` already installed, the native integration check is:

```sh
TEST_MONGOD="$(command -v mongod)" node node_modules/mocha/bin/mocha.js \
  packages/cli/utils/merge_cli_template/integration/mongodb_compose.js
```

It owns a temporary loopback port, process and data directory. It executes the
actual readiness script, checks repeated initialization, commits an atomic
multi-database transaction, verifies independent view/fence/receipt data and
restarts that temporary server with authentication to prove an unrelated
database is denied. That authenticated restart proves role-grant correctness in
an authentication-enabled native daemon; it does not prove authorization parity
with the generated no-auth Compose fixture. No Docker container or Cloud Build
job was executed.
