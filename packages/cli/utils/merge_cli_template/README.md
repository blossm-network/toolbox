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

An omitted `vpcConnectors.<env>` entry keeps the `<region>-network` connector.
A name attaches that connector with all egress. An explicit `null` deploys with
`--clear-vpc-connector`, because Cloud Run otherwise keeps the connector of the
previous revision.

Local Compose ignores the deployment connection. It starts a disposable
PostgreSQL 17 service with public fixture credentials, and the local entrypoint
signs blocks with an in-process key instead of KMS. A test-only build therefore
creates no KMS key, queue, topic, Scheduler job or IAM binding.

The CLI package's `test:integration` script starts the entrypoint the deploy
command renders, with the generated local environment, against the disposable
database named by `TEST_POSTGRES_URL`, and appends, reads and creates blocks
over loopback HTTP. It links the service's declared dependencies to this
workspace's packages and runs no install, Docker, Cloud Build or `gcloud`. It
is excluded from the ordinary `test` script and does not establish registry
publication, the container image, Cloud SQL connectivity or IAM.

```sh
TEST_POSTGRES_URL=postgres://user:password@127.0.0.1:5432/database \
  yarn lerna run test:integration --scope @blossm/cli --stream
```

## Runtime identity per procedure

`vendors.cloud.gcp.runtimeServiceAccounts.<env>` in `config.yaml` is the
runtime identity of every procedure deployed to that environment. A procedure
can name its own in its `blossm.yaml`:

```yaml
runtimeServiceAccounts:
  development: session-start@development-12345.iam.gserviceaccount.com
```

`cloudRun` in `src/deployment_config.js` owns the rule, for every procedure
kind. The procedure's entry for the deployed environment wins. An environment
the map does not name uses the `config.yaml` value, and with neither the deploy
step keeps its own default. A configured map that is null, empty, not a map, or
that holds any entry that is not a service account email fails before a build
is written or submitted. It never falls back to the broader `config.yaml`
account. Environment names are not checked, so a misspelled key is an
environment the map does not name.

This is the only Cloud Run setting a procedure overrides. The registry, build
identity, connector, ingress and instance settings stay per environment in
`config.yaml`. An event store's own grants in the next section follow whichever
identity was selected. The build identity needs `iam.serviceAccounts.actAs` on
each runtime identity it deploys.

## Access granted by each deployment

Every deployment grants the access its own procedure needs, so no service
needs an operator to run an IAM command after it deploys. The grants are
additive and repeat without effect on a redeploy. Event stores are covered in
the next section.

| Grant | To | On |
| --- | --- | --- |
| `roles/run.invoker` | `executer@<project>` | the procedure's own service, unless it is a public gateway |
| `roles/run.invoker` | the procedure's runtime identity | each service it calls |
| `roles/cloudtasks.enqueuer` | the runtime identity of a command or projection | the queue of each store, command or view store it calls, and a projection's own play queue |
| `roles/iam.serviceAccountUser` | the same identity, when it holds a queue grant | `executer@<project>`, whose identity its tasks carry |
| the role for each declared key use | the procedure's runtime identity | that Cloud KMS key |

The services a procedure calls are read from its `blossm.yaml`: a gateway's
routes in its own network, a command's own event store unless
`testing.store` is `false`, a projection's event stores and view store, and
every entry of `testing.dependencies` that names a procedure and has neither
`mocks` nor a `network`. A gateway in the core network with a strict route
also reaches the four core facts its authorization reads. A called service
must already be deployed, which the integration suites require anyway.

A procedure that uses a Cloud KMS key declares it:

```yaml
keys:
  - ring: jwt
    name: access
    use: sign # sign, verify, encrypt or decrypt
    location: global # the default
```

The runtime-identity grants are only made when the procedure has a configured
runtime identity. Without one the service runs as the project's default
account, whose access the build does not manage.

A configured build identity takes the same key grants for itself at the start
of every build, dry runs included, because the integration suites use the real
keys. It can do so with the `roles/cloudkms.admin` it already needs.

`blossm deploy` itself creates a configured runtime identity that does not
exist yet and lets the build identity deploy as it
(`roles/iam.serviceAccountUser` on that one account). It does this with the
credentials of the person deploying, before submitting the build, so the build
identity holds no authority over service accounts. That first deployment needs
a deployer who may create service accounts and set their policy, for example
`roles/iam.serviceAccountAdmin`. An identity that already exists is left
unchanged, and later deployments need no such role.

## Event-store deployment IAM

`src/write_build/event_store.js` owns the resource grants of a deployed event
store, for both the PostgreSQL and Mongo adapters. Every deploying build runs
`add-iam-policy-binding` for each grant, so a redeploy reconciles them and
other bindings on the same resource, conditional ones included, are kept. A
failed grant fails the build. A test-only (dry run) build and local Compose add
no grant.

Every grant is unconditional. The KMS key, service-account and Cloud Run
commands pass `--condition=None`, so a policy that already holds conditional
bindings does not stop a non-interactive build. The GA Pub/Sub topic and Cloud
Tasks queue commands have no `--condition` flag and are run without one. What
they do on a topic or queue whose policy already holds a conditional binding is
not established here. Command references:

- [`gcloud kms keys add-iam-policy-binding`](https://cloud.google.com/sdk/gcloud/reference/kms/keys/add-iam-policy-binding)
- [`gcloud iam service-accounts add-iam-policy-binding`](https://cloud.google.com/sdk/gcloud/reference/iam/service-accounts/add-iam-policy-binding)
- [`gcloud run services add-iam-policy-binding`](https://cloud.google.com/sdk/gcloud/reference/run/services/add-iam-policy-binding)
- [`gcloud pubsub topics add-iam-policy-binding`](https://cloud.google.com/sdk/gcloud/reference/pubsub/topics/add-iam-policy-binding)
- [`gcloud tasks queues add-iam-policy-binding`](https://cloud.google.com/sdk/gcloud/reference/tasks/queues/add-iam-policy-binding)

The runtime identity is the one selected in
[Runtime identity per procedure](#runtime-identity-per-procedure) when
configured. Otherwise the build passes
`${PROJECT_NUMBER}-compute@developer.gserviceaccount.com` as
`--service-account`, using Cloud Build's built-in substitution. Builds are
submitted to the deployment project, so this is the account Cloud Run would
default to. Naming it stops Cloud Run from keeping a different account that an
earlier revision of the service was given.

| Member | Role | Resource | Stores |
| --- | --- | --- | --- |
| runtime | `roles/cloudkms.cryptoKeyEncrypter` | key `private` in ring `<serviceName>-blockchain` | private only |
| runtime | `roles/cloudkms.signer` | key `producer` in the same ring | all |
| runtime | `roles/cloudkms.publicKeyViewer` | key `producer` in the same ring | all |
| runtime | `roles/pubsub.publisher` | each topic `<action>.<domain>.<service>` | all |
| runtime | `roles/cloudtasks.enqueuer` | queue `event-store-<service>-<domain>-create-block` | all |
| runtime | `roles/iam.serviceAccountUser` | service account `executer@<project>` | all |
| `executer@<project>` | `roles/run.invoker` | the store's Cloud Run service | all |

Only event stores receive these grants and these keys. The builds of other
procedure kinds are not affected by `isPublic`.

Queues, topics and the runtime grants are applied before `gcloud run deploy`,
because the store publishes pending events when it starts. The invoker grant
needs the service to exist, so it follows the deploy and precedes both
Scheduler jobs.

### Private and public stores

A store is public when its `blossm.yaml` sets `isPublic` to a truthy value,
and private otherwise, which is the default. The generator reads the value
from the same parsed `blossm.yaml` that is written to the service's
`config.json`, and both store entrypoints pass `config.isPublic || false` to
the adapter, so the build and the deployed store always agree.

`isPublic` decides one thing: whether block creation encrypts. A private store
encrypts each event payload and snapshot state in the block it exports, using
the `private` key. A public store exports them in the clear and never calls
that key. So the build of a public store does not create the `private` key and
does not grant `roles/cloudkms.cryptoKeyEncrypter`. Every store signs its
blocks, so the key ring, the `producer` key and its two grants are the same
for both.

`isPublic` does not make the Cloud Run service public. Every store is deployed
with `--no-allow-unauthenticated --invoker-iam-check` and the configured
ingress, and the only invoker the build adds is `executer@<project>`.

Only the command, fact and view gateways are public. They are deployed with
`--no-invoker-iam-check` and ingress `all`: Cloud Run skips the invoker check
for that one service and no `allUsers` binding is written. An organization
that enforces domain restricted sharing
(`constraints/iam.allowedPolicyMemberDomains`, the default since 2024) rejects
that binding, and `gcloud run deploy --allow-unauthenticated` then only warns
and leaves the gateway private. An organization that enforces
`constraints/run.managed.requireInvokerIam` rejects the gateway deployment
instead, and needs an exception for the project.

The build only adds. When a private store is redeployed as public, its
existing `private` key, that key's versions and the runtime's encrypter
binding are left in place: the build has no step that deletes a key or removes
a binding. The public store no longer uses them. Blocks the store exported
while private stay encrypted with that key. Revoking old access or disabling
key versions requires a separate operator decision. A public store redeployed
as private gets the key and the grant on that deploy.

IAM changes propagate eventually. A build that succeeds has submitted every
grant, which is not evidence that each one is in effect yet or that the store
can use it. A request made shortly after the first deploy can still be denied,
and live verification of the store remains a separate operator step.

### One-time operator bootstrap

The build never grants itself authority. Before the first deploy an operator
gives the build identity (`buildServiceAccounts.<env>`, or the project's
default Cloud Build account) these permissions in the deployment project,
through predefined or custom roles of the operator's choice:

| For | Permissions |
| --- | --- |
| KMS key grants | `cloudkms.cryptoKeys.getIamPolicy`, `cloudkms.cryptoKeys.setIamPolicy` |
| Topic grants | `pubsub.topics.getIamPolicy`, `pubsub.topics.setIamPolicy` |
| Queue grant | `cloudtasks.queues.getIamPolicy`, `cloudtasks.queues.setIamPolicy` |
| `executer` grant | `iam.serviceAccounts.getIamPolicy`, `iam.serviceAccounts.setIamPolicy` on `executer@<project>` |
| Service invoker grant | `run.services.getIamPolicy`, `run.services.setIamPolicy` |
| Deploying as the runtime | `iam.serviceAccounts.actAs` on the runtime identity |
| Scheduler jobs that call as `executer` | `iam.serviceAccounts.actAs` on `executer@<project>` |

Predefined roles that hold the policy permissions are `roles/cloudkms.admin`,
`roles/pubsub.admin`, `roles/cloudtasks.admin`, `roles/run.admin` and
`roles/iam.serviceAccountAdmin` on `executer@<project>`.
`roles/iam.serviceAccountUser` holds `iam.serviceAccounts.actAs`, and the build
identity needs it on both the runtime identity and `executer@<project>`: the
build creates and updates both Scheduler jobs with `executer` as their OIDC
account. The runtime's own `roles/iam.serviceAccountUser` grant on `executer`
in the table above covers the tasks the store enqueues, not the build. These
are in addition
to what the build already needs to create keys, topics, queues, Scheduler jobs
and the service. The `executer@<project>` account must exist, and the Cloud
Tasks and Cloud Scheduler service agents must be able to mint its OIDC tokens.

The build does not grant, and the operator provisions separately:

- Cloud SQL access for the runtime (`roles/cloudsql.client`), the instance and
  its database user.
- Secret Manager access for the runtime to the pinned `passwordSecret`
  (`roles/secretmanager.secretAccessor`), and for Mongo stores the secret
  bucket and its KMS key.
- `roles/cloudtasks.enqueuer` on the `event-store-<service>-<domain>` queue for
  the services that enqueue `add` on it. Those callers, not the store, hold
  that grant.

`test/event_store_iam.js` runs the generated steps against a `gcloud` double
and holds the exact grants and flags, their order, both identities, both
adapters, private and public stores, the dry run, a redeploy and a failed
grant. `packages/cli/blossm/test/postgres_event_store.js` runs the whole deploy
command for a private and a public store on each adapter and compares the
rendered `build.yaml` with the rendered `config.json` and entrypoint. The double rejects a KMS
key, service-account or Cloud Run binding without `--condition=None`, and a
topic or queue binding with any condition. It does not establish live IAM
behavior.

## Gateways behind a load balancer

By default Cloud Run maps a gateway's hostname straight onto its service, and
nothing limits how fast a client may call it. Naming a load balancer for an
environment puts every gateway of that environment behind a global external
Application Load Balancer, where a Cloud Armor policy can limit and block
requests before they reach a service:

```yaml
vendors:
  cloud:
    gcp:
      loadBalancers:
        production:
          urlMap: gateways
          certificateMap: gateways
          securityPolicy: gateways
          address: 203.0.113.7
```

All four are required. A partial or malformed entry fails before a build is
written. An environment without an entry keeps the direct mapping.

### What each gateway build adds

Each is named after the gateway's Cloud Run service and is safe to repeat.

| Order | Resource | Purpose |
| --- | --- | --- |
| 1 | the service, with ingress `internal-and-cloud-load-balancing` | refuses any request that did not come through the load balancer |
| 2 | a serverless network endpoint group | points the load balancer at the service |
| 3 | a global backend service | the unit the policy attaches to |
| 4 | the security policy on that backend, set on every build | the rate limit |
| 5 | the endpoint group as the backend's only backend | |
| 6 | a Google-managed certificate for the hostname, and its entry in the certificate map | TLS |
| 7 | a host rule and path matcher in the url map | routes the hostname to the backend |
| 8 | an `A` record for the hostname | points it at the load balancer |

The policy is attached before the hostname is routed, so a gateway is never
reachable without it. The ingress setting is what makes the policy binding:
without it a client could call the service's `run.app` address directly.

No domain mapping and no `CNAME` is written. A gateway that was deployed with
the direct mapping keeps its old mapping and `CNAME` until an operator removes
them; the `A` record cannot be created while the `CNAME` exists.

Two gateway builds that edit the url map at the same moment can collide. The
one that loses fails at step 7 and succeeds when run again.

A certificate is issued once the hostname resolves to the load balancer, which
can take some minutes after a gateway's first build.

### What the operator creates once per environment

A reserved global address, the security policy and its rules, the certificate
map, the url map, a target HTTPS proxy joining the url map and the certificate
map, and a forwarding rule on port 443 for the address. The url map needs a
default for hostnames no gateway owns.

The rate limit lives in the security policy, not in this repository. A rule
of action `throttle` or `rate-based-ban` keyed on `IP` covers every gateway
the policy is attached to.

### What the build identity needs

Beyond its existing roles: permission to create network endpoint groups and
backend services, to edit the url map, to use the security policy
(`compute.securityPolicies.use` and `compute.backendServices.setSecurityPolicy`),
to create Certificate Manager certificates and map entries, and to write `A`
records in the zone.

### The caller's address

A gateway's `CLIENT_ADDRESS_HOPS` is the number of addresses Google appends
to `X-Forwarded-For` before a request reaches the service: the caller's, and
then the load balancer's when there is one. Anything earlier in the header
was sent by the caller and cannot be trusted.

## Integration suites in generated builds

`src/write_build/steps/integration_suite.js` owns how every procedure's build
runs `test:base-integration` and `test:integration`.

A deploying build runs each suite directly. The first failure stops the build
before any image push or deploy step.

A test-only (dry run) build keeps going so the container logs are printed. Each
suite records its exit status in a reserved `.blossm-dry-run-status-<script>`
workspace file, and that step succeeds only if the record was written. The final
step runs `docker compose logs` and then fails the build unless every suite the
build ran recorded exactly `0`. A missing, empty or unreadable record counts as
a failure, and a test failure is reported even when printing logs also fails.
Cloud Build substitutes dollars in step args, so the owner doubles every shell
dollar; the generated args never contain a bare one.
`test/dry_run_suites.js` executes the generated shell against `yarn` and
`docker` doubles to hold these cases, after rejecting any bare dollar and
undoing the doubling the way Cloud Build does.

A command gateway's base suite posts to every command it routes. The generator
copies the first payload under `testing.validate.ok` of each of the gateway's
own commands into the gateway's `config.json` as `testing.payloads`, and the
suite sends it, so the request passes validation and reaches the command's
logic and its store. A command without an example is sent an empty payload.
The suite requires a response that is not 401 and is below 500, not a success:
a command that needs earlier state answers a valid payload with a 4xx.
