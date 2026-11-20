// Reads and validates the optional deployment profile in config.yaml. Every
// omitted field keeps the generator's historical behavior. Invalid values
// throw here, before a build description is written or submitted.
const fail = (path, expectation) => {
  throw new Error(`config.yaml ${path} must be ${expectation}.`);
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

const account = (value) => typeof value == "string" && serviceAccount.test(value);
const count = (value) => Number.isSafeInteger(value) && value >= 0;

export const registry = ({ env, config }) =>
  optional(
    config,
    "registries",
    env,
    (value) => typeof value == "string" && /^[a-z0-9][a-z0-9./_-]*$/.test(value),
    "a container registry path"
  );

export const buildServiceAccount = ({ env, config }) =>
  optional(config, "buildServiceAccounts", env, account, "a service account email");

// Cloud Run options. An undefined entry lets the deploy step keep its default.
// `vpcConnector: null` is an explicit request for no connector.
export const cloudRun = ({ env, config }) => {
  const connectors = config.vendors.cloud.gcp.vpcConnectors;
  const vpcConnector =
    connectors && Object.hasOwn(connectors, env) ? connectors[env] : undefined;
  if (
    vpcConnector != undefined &&
    !(typeof vpcConnector == "string" && /^[a-z][a-z0-9/-]*$/.test(vpcConnector))
  )
    fail(`vendors.cloud.gcp.vpcConnectors.${env}`, "a connector name or null");
  const maxInstances = optional(config, "maxInstances", env, count, "a whole number");
  const minInstances = optional(config, "minInstances", env, count, "a whole number");
  if (maxInstances === 0)
    fail(`vendors.cloud.gcp.maxInstances.${env}`, "at least 1");
  if (minInstances > maxInstances)
    fail(`vendors.cloud.gcp.minInstances.${env}`, "no greater than maxInstances");
  return {
    serviceAccount: optional(
      config,
      "runtimeServiceAccounts",
      env,
      account,
      "a service account email"
    ),
    vpcConnector,
    ingress: optional(
      config,
      "ingress",
      env,
      (value) => ingresses.includes(value),
      `one of ${ingresses.join(", ")}`
    ),
    maxInstances,
    minInstances,
  };
};
