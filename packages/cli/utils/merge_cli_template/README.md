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

## PostgreSQL event stores

`defaults.eventStore: postgres` in `config.yaml` selects
`@blossm/postgres-event-store` for every event-store procedure. The application
still supplies only `blossm.yaml` and `handlers.js`. The generator copies the
CLI's `event_store/postgres/deploy/src` files over the default entrypoint, so the service package
depends on the PostgreSQL adapter instead of the Mongo one. Mongo remains the
default, and view stores always use Mongo.

`src/postgres_env.js` owns the runtime variables: `PG_HOST`, `PG_DATABASE`,
`PG_USER`, `PG_MAX`, `PG_NAMESPACE` and `PG_PASSWORD`. The namespace is the
store's `service_domain` name from `src/database_name.js`.

A deployment reads `vendors.eventStore.postgres.connections.<env>` and fails
before a build is submitted if it is missing or invalid. `PG_HOST` is the
`/cloudsql/<instance>` socket directory, and Cloud Run binds `PG_PASSWORD` from
the pinned Secret Manager version. The password never enters the build
description. `src/deployment_config.js` owns that validation and the optional
`vendors.cloud.gcp` registry, identity, connector, ingress and instance
settings.

Local Compose ignores the deployment connection. It starts a disposable
PostgreSQL 17 service with public fixture credentials, and the local entrypoint
signs blocks with an in-process key instead of KMS. A test-only build therefore
creates no KMS key, queue, topic or Scheduler job.

The adapter packages are version 0.0.1 and unpublished. Until they are on the
registry, `yarn install` of a generated PostgreSQL service cannot resolve them.
