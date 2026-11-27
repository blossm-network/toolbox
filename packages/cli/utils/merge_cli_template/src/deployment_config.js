import { isIPv4 } from "node:net";

// Reads and validates the optional deployment profile in config.yaml. Every
// omitted field keeps the generator's historical behavior. Invalid values
// throw here, before a build description is written or submitted.
const fail = (path, expectation, file = "config.yaml") => {
  throw new Error(`${file} ${path} must be ${expectation}.`);
};

const eventStores = ["mongodb", "postgres"];

export const eventStoreKind = (config) => {
  const kind = config.defaults?.eventStore ?? "mongodb";
  if (!eventStores.includes(kind))
    fail("defaults.eventStore", `one of ${eventStores.join(", ")}`);
  return kind;
};

const identifier = /^[a-z_][a-z0-9_]{0,62}$/;
const serviceAccount = /^[a-z0-9-]+@[a-z0-9.-]+\.gserviceaccount\.com$/;
const ingresses = ["all", "internal", "internal-and-cloud-load-balancing"];

// The password is never read here. Cloud Run binds the named Secret Manager
// version into the service at deployment.
export const postgresConnection = ({ env, config }) => {
  const path = `vendors.eventStore.postgres.connections.${env}`;
  const connection = config.vendors?.eventStore?.postgres?.connections?.[env];
  if (connection == null || typeof connection != "object")
    fail(path, "configured to deploy a PostgreSQL event store");
  const { database, user, max, cloudSqlInstance, passwordSecret } = connection;
  for (const [key, value] of Object.entries({ database, user }))
    if (typeof value != "string" || !identifier.test(value))
      fail(`${path}.${key}`, "a lowercase PostgreSQL identifier");
  if (!Number.isSafeInteger(max) || max < 1)
    fail(`${path}.max`, "a positive integer");
  if (
    typeof cloudSqlInstance != "string" ||
    !/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(cloudSqlInstance)
  )
    fail(`${path}.cloudSqlInstance`, "project:region:instance");
  const name = passwordSecret?.name;
  const version = passwordSecret?.version;
  if (typeof name != "string" || !/^[A-Za-z0-9_-]{1,255}$/.test(name))
    fail(`${path}.passwordSecret.name`, "a Secret Manager secret name");
  if (!/^[1-9][0-9]*$/.test(`${version}`))
    fail(`${path}.passwordSecret.version`, "a pinned numeric version");
  return {
    database,
    user,
    max,
    cloudSqlInstance,
    passwordSecret: `${name}:${version}`,
  };
};

const optional = (config, key, env, valid, expectation) => {
  const value = config.vendors.cloud.gcp[key]?.[env];
  if (value != undefined && !valid(value))
    fail(`vendors.cloud.gcp.${key}.${env}`, expectation);
  return value ?? undefined;
};

const account = (value) =>
  typeof value == "string" && serviceAccount.test(value);
const count = (value) => Number.isSafeInteger(value) && value >= 0;

export const registry = ({ env, config }) =>
  optional(
    config,
    "registries",
    env,
    (value) =>
      typeof value == "string" && /^[a-z0-9][a-z0-9./_-]*$/.test(value),
    "a container registry path",
  );

export const buildServiceAccount = ({ env, config }) =>
  optional(
    config,
    "buildServiceAccounts",
    env,
    account,
    "a service account email",
  );

// A procedure's blossm.yaml may name its own runtime identity per environment.
// A configured map must be complete and valid: an empty, null or malformed
// override fails instead of falling back to the broader config.yaml account.
// Only an environment the map does not name uses that default.
const procedureAccount = ({ env, procedure }) => {
  if (!Object.hasOwn(procedure, "runtimeServiceAccounts")) return undefined;
  const accounts = procedure.runtimeServiceAccounts;
  const path = "runtimeServiceAccounts";
  const entries =
    accounts != null && typeof accounts == "object" && !Array.isArray(accounts)
      ? Object.entries(accounts)
      : [];
  if (!entries.length)
    fail(path, "a map of environment to service account email", "blossm.yaml");
  for (const [key, value] of entries)
    if (!account(value))
      fail(`${path}.${key}`, "a service account email", "blossm.yaml");
  return Object.hasOwn(accounts, env) ? accounts[env] : undefined;
};

// The shared load balancer public gateways sit behind, when one is configured.
// All four parts are needed: a partial entry fails instead of deploying a
// gateway that is reachable around its protections.
const resourceName = /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/;
const loadBalancer = ({ env, config }) => {
  const path = `vendors.cloud.gcp.loadBalancers.${env}`;
  const value = config.vendors.cloud.gcp.loadBalancers?.[env];
  if (value == undefined) return undefined;
  if (typeof value != "object") fail(path, "a load balancer definition");
  for (const key of ["urlMap", "certificateMap", "securityPolicy"])
    if (typeof value[key] != "string" || !resourceName.test(value[key]))
      fail(`${path}.${key}`, "a resource name");
  if (!isIPv4(value.address)) fail(`${path}.address`, "an IPv4 address");
  const { urlMap, certificateMap, securityPolicy, address } = value;
  return { urlMap, certificateMap, securityPolicy, address };
};

// Cloud Run options. An undefined entry lets the deploy step keep its default.
// `vpcConnector: null` is an explicit request for no connector, which the
// deploy step enforces with `--clear-vpc-connector`. `procedure` is the parsed
// blossm.yaml of the procedure being deployed.
export const cloudRun = ({ env, config, procedure = {} }) => {
  const connectors = config.vendors.cloud.gcp.vpcConnectors;
  const vpcConnector =
    connectors && Object.hasOwn(connectors, env) ? connectors[env] : undefined;
  if (
    vpcConnector != undefined &&
    !(
      typeof vpcConnector == "string" && /^[a-z][a-z0-9/-]*$/.test(vpcConnector)
    )
  )
    fail(`vendors.cloud.gcp.vpcConnectors.${env}`, "a connector name or null");
  const maxInstances = optional(
    config,
    "maxInstances",
    env,
    count,
    "a whole number",
  );
  const minInstances = optional(
    config,
    "minInstances",
    env,
    count,
    "a whole number",
  );
  if (maxInstances === 0)
    fail(`vendors.cloud.gcp.maxInstances.${env}`, "at least 1");
  if (minInstances > maxInstances)
    fail(
      `vendors.cloud.gcp.minInstances.${env}`,
      "no greater than maxInstances",
    );
  return {
    serviceAccount:
      procedureAccount({ env, procedure }) ??
      optional(
        config,
        "runtimeServiceAccounts",
        env,
        account,
        "a service account email",
      ),
    vpcConnector,
    ingress: optional(
      config,
      "ingress",
      env,
      (value) => ingresses.includes(value),
      `one of ${ingresses.join(", ")}`,
    ),
    maxInstances,
    minInstances,
    loadBalancer: loadBalancer({ env, config }),
  };
};
