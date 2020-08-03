const roboSay = require("@blossm/robo-say");

const rootDir = require("@blossm/cli-root-dir");
const hash = require("@blossm/operation-hash");
const { promisify } = require("util");
const yaml = require("yaml");
const path = require("path");
const fs = require("fs-extra");
const { red } = require("chalk");

const access = promisify(fs.access);

const writeCompose = require("./src/write_compose");
const writeBuild = require("./src/write_build");
const resolveTransientInfo = require("./src/resolve_transient_info");

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

const envCoreContainerRegistry = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.core.registries.production;
    case "sandbox":
      return config.core.registries.sandbox;
    case "staging":
      return config.core.registries.staging;
    case "development":
      return config.core.registries.development;
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

const envPublicKeyUrl = ({ env, config }) =>
  config.core && config.core.network != config.network
    ? `https://f.${env == "production" ? "" : "snd."}${
        config.core.network
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
    blossmConfig.vendors.cloud.gcp.defaults.memoryOverrides[config.procedure] ||
    blossmConfig.vendors.cloud.gcp.defaults.memory
  );
};

const configTimeout = ({ config, blossmConfig }) => {
  if (config.timeout) return config.timeout;
  return blossmConfig.vendors.cloud.gcp.defaults.timeout;
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
    .map((e) => `${e.domain}.${e.service || config.service}`)
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
        ? ["session.core", "identity.core", "role.core", "principal.core"]
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

const addDefaultDependencies = ({ config, coreNetwork }) => {
  const tokenDependencies = [
    {
      name: "upgrade",
      domain: "session",
      service: "core",
      network: coreNetwork,
      procedure: "command",
    },
    {
      domain: "session",
      service: "core",
      network: coreNetwork,
      procedure: "event-store",
    },
    {
      domain: "role",
      service: "core",
      network: coreNetwork,
      procedure: "event-store",
    },
    {
      domain: "principal",
      service: "core",
      network: coreNetwork,
      procedure: "event-store",
    },
    {
      domain: "identity",
      service: "core",
      network: coreNetwork,
      procedure: "event-store",
    },
    {
      name: "terminated",
      domain: "session",
      service: "core",
      network: coreNetwork,
      procedure: "fact",
    },
    {
      name: "permissions",
      domain: "role",
      service: "core",
      network: coreNetwork,
      procedure: "fact",
    },
  ];

  switch (config.procedure) {
    case "command":
      return [
        ...config.testing.dependencies,
        ...eventStoreDependencies({
          dependencies: config.testing.dependencies,
        }),
        {
          domain: config.domain,
          service: config.service,
          procedure: "event-store",
        },
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
          name: "open",
          domain: "connection",
          service: "system",
          network: coreNetwork,
          procedure: "command",
        },
        {
          domain: "updates",
          service: "system",
          network: coreNetwork,
          procedure: "command-gateway",
          mocks: [
            {
              command: "push",
              code: 202,
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
          .filter((c) => c.network == undefined)
          .map((command) => {
            return {
              name: command.name,
              domain: config.domain,
              service: config.service,
              procedure: "command",
            };
          }),
      ];
      return [...eventStoreDependencies({ dependencies }), ...dependencies];
    }
    case "view-gateway":
      return [
        ...(config.views.some(
          (s) => s.protection == undefined || s.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.views
          .filter((v) => v.network == undefined)
          .map((view) => {
            return {
              name: view.name,
              context: config.context,
              procedure: view.procedure,
            };
          }),
      ];
    case "fact-gateway":
      return [
        ...(config.facts.some(
          (f) => f.protection == undefined || f.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.facts
          .filter((f) => f.network == undefined)
          .map((fact) => {
            return {
              name: fact.name,
              ...(config.domain && { domain: config.domain }),
              ...(config.service && { service: config.service }),
              procedure: "fact",
            };
          }),
      ];
    default:
      return config.testing.dependencies;
  }
};

const writeConfig = ({ config, coreNetwork, workingDir, host }) => {
  const newConfigPath = path.resolve(workingDir, "config.json");
  if (!config.testing) config.testing = {};
  if (!config.testing.dependencies) config.testing.dependencies = [];

  const { dependencies, events } = resolveTransientInfo(
    addDefaultDependencies({ config, coreNetwork })
  );

  const adjustedDependencies = [];
  for (const dependency of dependencies) {
    switch (dependency.procedure) {
      case "command-gateway":
        adjustedDependencies.push({
          procedure: "http",
          host: `c.${dependency.domain}.${dependency.service}.${coreNetwork}`,
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
          host: `v.${dependency.context}.${coreNetwork}`,
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
          }.${coreNetwork}`,
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
      default:
        if (dependency.mocks) {
          adjustedDependencies.push({
            procedure: "http",
            host: `${hash([
              ...(dependency.name ? [dependency.name] : []),
              ...(dependency.domain ? [dependency.domain] : []),
              ...(dependency.service ? [dependency.service] : []),
              ...(dependency.context ? [dependency.context] : []),
              dependency.procedure,
            ])}
            .${host}`,
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

  const package = {
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
  fs.writeFileSync(packagePath, JSON.stringify(package));
};

const configure = async (workingDir, configFn, env, strict) => {
  const configPath = path.resolve(workingDir, "blossm.yaml");
  const baseConfigPath = path.resolve(workingDir, "base_config.json");

  try {
    const config = yaml.parse(fs.readFileSync(configPath, "utf8"));
    const baseConfig = require(baseConfigPath);
    writePackage({ config, baseConfig, workingDir });
    delete config.dependencies;
    delete config.devDependencies;

    const blossmConfig = rootDir.config();
    const project = envProject({ env, config: blossmConfig });

    const blockSchedule = config.blockSchedule || blossmConfig.blockSchedule;
    const region =
      config.region || blossmConfig.vendors.cloud.gcp.defaults.region;
    const network = blossmConfig.network;
    const baseCoreNetwork = blossmConfig.core
      ? blossmConfig.core.network
      : network;
    const coreNetwork =
      baseCoreNetwork == network
        ? `${envUriSpecifier(env)}${baseCoreNetwork}`
        : env == "production"
        ? baseCoreNetwork
        : `snd.${baseCoreNetwork}`;

    const dnsZone = config.dnsZone || blossmConfig.vendors.cloud.gcp.dnsZone;

    const domain = config.domain;
    const service = config.service;
    const context = config.context;
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

    const secretBucketKeyLocation = "global";
    const secretBucketKeyRing = "secrets-bucket";

    const containerRegistery = `us.gcr.io/${project}`;
    const coreContainerRegistery = blossmConfig.core
      ? envCoreContainerRegistry({
          env,
          config: blossmConfig,
        })
      : containerRegistery;

    const mainContainerName = "main";

    const host = `${region}.${envUriSpecifier(env)}${network}`;

    writeConfig({ config, coreNetwork, workingDir, host });

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
      name,
      project,
      procedure,
      network,
      host,
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
      coreNetwork,
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
      network: "local.network",
      host: "local.network",
      service,
      project,
      context,
      region,
      containerRegistery,
      coreContainerRegistery,
      coreNetwork,
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

module.exports = async ({
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
