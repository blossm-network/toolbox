import roboSay from "@blossm/robo-say";
import rootDir from "@blossm/cli-root-dir";
import hash from "@blossm/operation-hash";
import { promisify } from "util";
import yaml from "yaml";
import path from "path";
import fs from "fs-extra";
import { red } from "chalk";

const access = promisify(fs.access);

import writeCompose from "./src/write_compose/index.js";
import writeBuild from "./src/write_build/index.js";
import resolveTransientInfo from "./src/resolve_transient_info.js";

const envUriSpecifier = (env) => {
  switch (env) {
    case "sandbox":
      return "snd.";
    case "staging":
      return "stg.";
    case "development":
      return "dev.";
    default:
      return "";
  }
};

const envDependencyKeyEnvironmentVariables = ({ env, config }) => {
  if (!config.dependencies) return {};
  let environmentVariables = {};

  for (const network in config.dependencies) {
    const baseName = network.toUpperCase().split(".").join("_");
    const { root, secretName } = config.dependencies[network].keys[env];
    environmentVariables = {
      ...environmentVariables,
      [`${baseName}_KEY_ROOT`]: root,
      [`${baseName}_KEY_SECRET_NAME`]: secretName,
    };
  }

  return environmentVariables;
};

const envBaseContainerRegistry = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.base.registries.production;
    case "sandbox":
      return config.base.registries.sandbox;
    case "staging":
      return config.base.registries.staging;
    case "development":
      return config.base.registries.development;
    default:
      return "";
  }
};
const envProject = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.projects.production;
    case "sandbox":
      return config.vendors.cloud.gcp.projects.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.projects.staging;
    case "development":
      return config.vendors.cloud.gcp.projects.development;
    default:
      return "";
  }
};
const envRedisIp = ({ env, config }) => {
  if (!config.vendors.cache || !config.vendors.cache.redis) return;
  switch (env) {
    case "production":
      return config.vendors.cache.redis.ip.production;
    case "sandbox":
      return config.vendors.cache.redis.ip.sandbox;
    case "staging":
      return config.vendors.cache.redis.ip.staging;
    case "development":
      return config.vendors.cache.redis.ip.development;
    default:
      return "";
  }
};

const envPublicKeyUrl = ({ env, config }) =>
  config.base && config.base.network != config.network
    ? `https://f.${env == "production" ? "" : "snd."}${
        config.base.network
      }/public-key`
    : `https://f.${envUriSpecifier(env)}${config.network}/public-key`;

const envComputeUrlId = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.computeUrlIds.production;
    case "sandbox":
      return config.vendors.cloud.gcp.computeUrlIds.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.computeUrlIds.staging;
    case "development":
      return config.vendors.cloud.gcp.computeUrlIds.development;
    default:
      return "";
  }
};

const envSecretsBucket = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.secretsBuckets.production;
    case "sandbox":
      return config.vendors.cloud.gcp.secretsBuckets.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.secretsBuckets.staging;
    case "development":
      return config.vendors.cloud.gcp.secretsBuckets.development;
    default:
      return "";
  }
};

const envRolesBucket = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.rolesBuckets.production;
    case "sandbox":
      return config.vendors.cloud.gcp.rolesBuckets.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.rolesBuckets.staging;
    case "development":
      return config.vendors.cloud.gcp.rolesBuckets.development;
    default:
      return "";
  }
};

const envMongodbUser = ({ env, config, procedure }) => {
  switch (procedure) {
    case "view-store":
      switch (env) {
        case "production":
          return config.vendors.viewStore.mongodb.users.production;
        case "sandbox":
          return config.vendors.viewStore.mongodb.users.sandbox;
        case "staging":
          return config.vendors.viewStore.mongodb.users.staging;
        case "development":
          return config.vendors.viewStore.mongodb.users.development;
        default:
          return "";
      }
    case "event-store":
      switch (env) {
        case "production":
          return config.vendors.eventStore.mongodb.users.production;
        case "sandbox":
          return config.vendors.eventStore.mongodb.users.sandbox;
        case "staging":
          return config.vendors.eventStore.mongodb.users.staging;
        case "development":
          return config.vendors.eventStore.mongodb.users.development;
        default:
          return "";
      }
  }
};

const envMongodbHost = ({ env, config, procedure }) => {
  switch (procedure) {
    case "view-store":
      switch (env) {
        case "production":
          return config.vendors.viewStore.mongodb.hosts.production;
        case "sandbox":
          return config.vendors.viewStore.mongodb.hosts.sandbox;
        case "staging":
          return config.vendors.viewStore.mongodb.hosts.staging;
        case "development":
          return config.vendors.viewStore.mongodb.hosts.development;
        default:
          return "";
      }
    case "event-store":
      switch (env) {
        case "production":
          return config.vendors.eventStore.mongodb.hosts.production;
        case "sandbox":
          return config.vendors.eventStore.mongodb.hosts.sandbox;
        case "staging":
          return config.vendors.eventStore.mongodb.hosts.staging;
        case "development":
          return config.vendors.eventStore.mongodb.hosts.development;
        default:
          return "";
      }
  }
};

const mongodbProtocol = ({ config, procedure }) => {
  switch (procedure) {
    case "view-store":
      return config.vendors.viewStore.mongodb.protocol;
    case "event-store":
      return config.vendors.eventStore.mongodb.protocol;
  }
};

const configMemory = ({ config, blossmConfig }) => {
  if (config.memory) return config.memory;
  return (
    (blossmConfig.vendors.cloud.gcp.defaults.memoryOverrides &&
      blossmConfig.vendors.cloud.gcp.defaults.memoryOverrides[
        config.procedure
      ]) ||
    blossmConfig.vendors.cloud.gcp.defaults.memory
  );
};

const configTimeout = ({ config, blossmConfig }) => {
  if (config.timeout) return config.timeout;
  return (
    (blossmConfig.vendors.cloud.gcp.defaults.timeoutOverrides &&
      blossmConfig.vendors.cloud.gcp.defaults.timeoutOverrides[
        config.procedure
      ]) ||
    blossmConfig.vendors.cloud.gcp.defaults.timeout
  );
};

const copyScript = async (scriptDir, workingDir) => {
  const scripts = path.resolve(scriptDir, "src");
  try {
    await access(scripts, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "Full view store scripts not found. Reach out to bugs@blossm.network please, it's in everyone's best interest.",
        red.bold("internal error")
      )
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
  await fs.copy(scripts, workingDir);
};

const copyTemplate = async (templateDir, workingDir) => {
  const template = path.resolve(templateDir, "template");
  try {
    await access(template, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "The deploy template not found. Reach out to bugs@blossm.network please, it's in everyone's best interest.",
        red.bold("internal error")
      )
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
  await fs.copy(template, workingDir);
};

const copySource = async (p, workingDir) => {
  const srcDir = path.resolve(process.cwd(), p);
  try {
    await access(srcDir, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "The provided path isn't reachable. Double check it's correct and give it another go."
      ),
      red.bold("error")
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
  await fs.copy(srcDir, workingDir);
};

const topicsForDependencies = (config, events) => {
  const array = (events || [])
    .map((e) =>
      e.actions.map((a) => `${a}.${e.domain}.${e.service || config.service}`)
    )
    .flat()
    .concat(
      (config.procedure == "command-gateway" &&
        config.commands.some(
          (c) => c.protection == undefined || c.protection == "strict"
        )) ||
        (config.procedure == "view-gateway" &&
          config.views.some(
            (v) => v.protection == undefined || v.protection == "strict"
          )) ||
        (config.procedure == "fact-gateway" &&
          config.facts.some(
            (f) => f.protection == undefined || f.protection == "strict"
          ))
        ? [
            "start.session.base",
            "upgrade.session.base",
            "register.identity.base",
            "create.role.base",
            "add-roles.principal.base",
          ]
        : []
    );
  return [...new Set(array)];
};

const eventStoreDependencies = ({ dependencies }) => {
  let result = [];
  for (const dependency of dependencies) {
    if (
      dependency.procedure == "command" &&
      ![...dependencies, ...result].some(
        (d) =>
          d.procedure == "event-store" &&
          d.domain == dependency.domain &&
          d.service == dependency.service
      )
    ) {
      result.push({
        procedure: "event-store",
        service: dependency.service,
        domain: dependency.domain,
      });
    }
  }
  return result;
};

const addDefaultDependencies = ({ config, localBaseNetwork }) => {
  const tokenDependencies = [
    {
      name: "upgrade",
      domain: "session",
      service: "base",
      network: localBaseNetwork,
      procedure: "command",
    },
    {
      domain: "session",
      service: "base",
      network: localBaseNetwork,
      procedure: "event-store",
    },
    {
      domain: "role",
      service: "base",
      network: localBaseNetwork,
      procedure: "event-store",
    },
    {
      domain: "principal",
      service: "base",
      network: localBaseNetwork,
      procedure: "event-store",
    },
    {
      domain: "account",
      service: "base",
      network: localBaseNetwork,
      procedure: "event-store",
    },
    {
      name: "terminated",
      domain: "session",
      service: "base",
      network: localBaseNetwork,
      procedure: "fact",
    },
    {
      name: "permissions",
      domain: "role",
      service: "base",
      network: localBaseNetwork,
      procedure: "fact",
    },
  ];

  const groupsFactProcedure = {
    procedure: "fact-gateway",
    domain: "principal",
    service: "base",
    network: localBaseNetwork,
    mocks: [
      {
        fact: "groups",
        code: 200,
        response: [
          {
            root: "some-group-root",
            service: "some-group-service",
            network: "some-group-network",
          },
        ],
      },
    ],
  };

  switch (config.procedure) {
    case "command":
      return [
        ...config.testing.dependencies,
        ...eventStoreDependencies({
          dependencies: config.testing.dependencies,
        }),
        ...(config.testing.store !== false
          ? [
              {
                domain: config.domain,
                service: config.service,
                procedure: "event-store",
              },
            ]
          : []),
      ];
    case "projection":
      return [
        ...config.testing.dependencies,
        ...config.events.map((store) => {
          return {
            domain: store.domain,
            service: store.service,
            procedure: "event-store",
          };
        }),
        {
          name: config.name,
          context: config.context,
          procedure: "view-store",
        },
        {
          domain: "connection",
          service: "base",
          network: localBaseNetwork,
          procedure: "command-gateway",
          mocks: [
            {
              command: "open",
              code: 202,
            },
          ],
        },
        {
          domain: "updates",
          service: "base",
          network: localBaseNetwork,
          procedure: "command-gateway",
          mocks: [
            {
              command: "push",
              code: 202,
            },
          ],
        },
        groupsFactProcedure,
        {
          procedure: "fact-gateway",
          domain: "group",
          service: "base",
          network: localBaseNetwork,
          mocks: [
            {
              fact: "principals",
              code: 200,
            },
          ],
        },
      ];
    case "command-gateway": {
      const dependencies = [
        ...(config.commands.some(
          (c) => c.protection == undefined || c.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.commands
          .filter((c) => c.network == undefined && !c.local)
          .map((command) => ({
            name: command.name,
            domain: config.domain,
            service: config.service,
            procedure: "command",
          })),
      ];
      return dependencies;
      // ...(!config.testing || config.testing.store !== false
      //   ? eventStoreDependencies({ dependencies })
      //   : []),
    }
    case "view-gateway":
      return [
        ...(config.views.some(
          (s) => s.protection == undefined || s.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.views
          .filter((v) => v.network == undefined && !v.local)
          .map((view) => {
            return {
              name: view.name,
              context: config.context,
              procedure: view.procedure,
            };
          }),
      ];
    case "fact-gateway": {
      return [
        ...(config.facts.some(
          (f) => f.protection == undefined || f.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.facts
          .filter((f) => f.network == undefined && !f.local)
          .map((fact) => {
            return {
              name: fact.name,
              ...(config.domain && { domain: config.domain }),
              ...(config.service && { service: config.service }),
              procedure: "fact",
            };
          }),
      ];
    }
    case "view-store":
      return [groupsFactProcedure];
    default:
      return config.testing.dependencies;
  }
};

const writeConfig = ({
  config,
  localNetwork,
  localBaseNetwork,
  workingDir,
}) => {
  const newConfigPath = path.resolve(workingDir, "config.json");
  if (!config.testing) config.testing = {};
  if (!config.testing.dependencies) config.testing.dependencies = [];

  const { dependencies, events } = resolveTransientInfo(
    addDefaultDependencies({ config, localBaseNetwork })
  );

  const adjustedDependencies = [];
  for (const dependency of dependencies) {
    switch (dependency.procedure) {
      case "command-gateway":
        adjustedDependencies.push({
          procedure: "http",
          host: `c.${dependency.domain}.${dependency.service}.${localBaseNetwork}`,
          mocks: dependency.mocks.map((mock) => {
            return {
              method: "post",
              path: `/${mock.command}`,
              ...(mock.code && { code: mock.code }),
              ...(mock.response && { response: mock.response }),
              ...(mock.calls && { calls: mock.calls }),
            };
          }),
        });
        break;
      case "view-gateway":
        adjustedDependencies.push({
          procedure: "http",
          host: `v.${dependency.context}.${localBaseNetwork}`,
          mocks: dependency.mocks.map((mock) => {
            return {
              method: "get",
              path: `/${mock.view}`,
              ...(mock.code && { code: mock.code }),
              ...(mock.response && { response: mock.response }),
              ...(mock.calls && { calls: mock.calls }),
            };
          }),
        });

        if (!dependency.procedure) {
          adjustedDependencies.push(dependency);
          continue;
        }
        break;
      case "fact-gateway":
        adjustedDependencies.push({
          procedure: "http",
          host: `f${dependency.domain ? `.${dependency.domain}` : ""}${
            dependency.service ? `.${dependency.service}` : ""
          }.${dependency.network || localBaseNetwork}`,
          mocks: dependency.mocks.map((mock) => {
            return {
              method: "get",
              path: `/${mock.fact}`,
              ...(mock.code && { code: mock.code }),
              ...(mock.response && { response: mock.response }),
              ...(mock.calls && { calls: mock.calls }),
            };
          }),
        });
        break;
      case "http":
        adjustedDependencies.push(dependency);
        break;
      default:
        if (dependency.mocks) {
          adjustedDependencies.push({
            procedure: "http",
            host: `${hash(
              ...(dependency.name ? [dependency.name] : []),
              ...(dependency.domain ? [dependency.domain] : []),
              ...(dependency.service ? [dependency.service] : []),
              ...(dependency.context ? [dependency.context] : []),
              dependency.procedure
            )}.${localNetwork}`,
            mocks: dependency.mocks,
          });
        } else {
          adjustedDependencies.push(dependency);
        }
    }
  }

  config.testing = {
    ...config.testing,
    dependencies: adjustedDependencies,
    topics: topicsForDependencies(config, events),
  };

  delete config.testing.events;

  fs.writeFileSync(newConfigPath, JSON.stringify(config));
};

const writePackage = ({ config, baseConfig, workingDir }) => {
  const dependencies = {
    ...baseConfig.dependencies,
    ...(config.dependencies || {}),
  };
  const devDependencies = {
    ...baseConfig.devDependencies,
    ...config.devDependencies,
  };

  for (const key in dependencies) {
    if (key in devDependencies) delete devDependencies[key];
  }

  const packageJson = {
    main: "index.js",
    scripts: {
      start: "node index.js",
      "test:unit": "mocha --recursive test/unit",
      "test:base-unit": "mocha --recursive base_test/unit",
      "test:base-integration":
        "mocha --recursive base_test/integration --timeout 40000",
      "test:integration": "mocha --recursive test/integration --timeout 40000",
    },
    dependencies,
    devDependencies,
  };

  const packagePath = path.resolve(workingDir, "package.json");
  fs.writeFileSync(packagePath, JSON.stringify(packageJson));
};

const configure = async (workingDir, configFn, env, strict) => {
  const configPath = path.resolve(workingDir, "blossm.yaml");
  const baseConfigPath = path.resolve(workingDir, "base_config.json");

  try {
    const config = yaml.parse(fs.readFileSync(configPath, "utf8"));
    const baseConfig = import(baseConfigPath);
    writePackage({ config, baseConfig, workingDir });
    delete config.dependencies;
    delete config.devDependencies;

    const blossmConfig = rootDir.config();
    const project = envProject({ env, config: blossmConfig });

    const blockSchedule = config.blockSchedule || blossmConfig.blockSchedule;
    const region =
      config.region || blossmConfig.vendors.cloud.gcp.defaults.region;
    const network = blossmConfig.network;
    const baseNetworkSuffix = blossmConfig.base
      ? blossmConfig.base.network
      : network;
    const baseNetwork =
      baseNetworkSuffix == network
        ? `${envUriSpecifier(env)}${baseNetworkSuffix}`
        : env == "production"
        ? baseNetworkSuffix
        : `snd.${baseNetworkSuffix}`;

    const dnsZone = config.dnsZone || blossmConfig.vendors.cloud.gcp.dnsZone;

    const domain = config.domain;
    const service = config.service;
    const context = config.context;
    const bootstrapContext = config.bootstrap;
    const actions = config.actions;
    const events = config.events;
    const procedure = config.procedure;
    const name = config.name;
    const envVars = config.env && config.env[env];
    const devEnvVars = config.devEnv && config.devEnv[env];

    const dependencyKeyEnvironmentVariables = envDependencyKeyEnvironmentVariables(
      { env, config: blossmConfig }
    );

    const rolesBucket = envRolesBucket({ env, config: blossmConfig });
    const secretBucket = envSecretsBucket({ env, config: blossmConfig });
    const publicKeyUrl = envPublicKeyUrl({ env, config: blossmConfig });

    const redisIp = envRedisIp({ env, config: blossmConfig });

    const secretBucketKeyLocation = "global";
    const secretBucketKeyRing = "secrets-bucket";

    const containerRegistery = `us.gcr.io/${project}`;
    const baseContainerRegistery = blossmConfig.base
      ? envBaseContainerRegistry({
          env,
          config: blossmConfig,
        })
      : containerRegistery;

    const mainContainerName = "main";

    const localNetwork = "local.network";
    const localBaseNetwork =
      baseNetworkSuffix == network ? localNetwork : "local.base.network";

    const host = `${region}.${envUriSpecifier(env)}${network}`;

    writeConfig({
      config,
      localNetwork,
      localBaseNetwork,
      workingDir,
    });

    const computeUrlId = envComputeUrlId({ env, config: blossmConfig });

    const custom = configFn(config);

    writeBuild({
      workingDir,
      env,
      publicKeyUrl,
      region,
      domain,
      actions,
      events,
      context,
      bootstrapContext,
      name,
      project,
      procedure,
      network,
      host,
      redisIp,
      timeout: configTimeout({ config, blossmConfig }),
      memory: configMemory({ config, blossmConfig }),
      mongodbUser: envMongodbUser({ env, config: blossmConfig, procedure }),
      mongodbHost: envMongodbHost({ env, config: blossmConfig, procedure }),
      mongodbProtocol: mongodbProtocol({
        config: blossmConfig,
        procedure,
      }),
      mainContainerName,
      containerRegistery,
      localNetwork,
      blockSchedule,
      envVars,
      devEnvVars,
      envUriSpecifier: envUriSpecifier(env),
      computeUrlId,
      dnsZone,
      service,
      rolesBucket,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      baseNetwork,
      localBaseNetwork,
      strict,
      dependencyKeyEnvironmentVariables,
      ...custom,
    });

    writeCompose({
      config,
      workingDir,
      publicKeyUrl,
      procedure,
      port: 80,
      mainContainerName,
      env,
      network: localNetwork,
      host: localNetwork,
      service,
      project,
      context,
      region,
      containerRegistery,
      baseContainerRegistery,
      baseNetwork,
      localBaseNetwork,
      domain,
      name,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      envVars,
      devEnvVars,
      dependencyKeyEnvironmentVariables,
      ...custom,
    });
  } catch (e) {
    //eslint-disable-next-line no-console
    console.error(e);
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "blossm.yaml isn't parseable. Double check it's correct and give it another go."
      ),
      red.bold("error")
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
};

export default async ({
  scriptDir,
  workingDir,
  path,
  env,
  dry,
  configFn,
}) => {
  await copyTemplate(__dirname, workingDir);
  await copyScript(scriptDir, workingDir);
  await copySource(path, workingDir);
  await configure(workingDir, configFn, env, !dry);
};
