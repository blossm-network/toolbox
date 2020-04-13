const roboSay = require("@blossm/robo-say");
const rootDir = require("@blossm/cli-root-dir");
const fs = require("fs-extra");
const ncp = require("ncp");
const { promisify } = require("util");
const yaml = require("yaml");
const path = require("path");
const { red } = require("chalk");

const access = promisify(fs.access);
const copy = promisify(ncp);

const writeCompose = require("./src/write_compose");
const writeBuild = require("./src/write_build");
const resolveTransientInfo = require("./src/resolve_transient_info");

const envUriSpecifier = env => {
  switch (env) {
    case "sandbox":
    case "staging":
    case "development":
      return `${env}.`;
    default:
      return "";
  }
};

const envDependencyKeyEnvironmentVariables = ({ env, config }) => {
  if (!config.dependencies) return {};
  let environmentVariables = {};

  for (const network in config.dependencies) {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ network });
    const baseName = network
      .toUpperCase()
      .split(".")
      .join("_");
    //TODO
    //eslint-disable-next-line no-console
    console.log({ baseName });
    const { id, secretName } = config.dependencies[network].keys[env];
    //TODO
    //eslint-disable-next-line no-console
    console.log({ id, secretName });
    environmentVariables = {
      ...environmentVariables,
      [`${baseName}_KEY_ID`]: id,
      [`${baseName}_KEY_SECRET_NAME`]: secretName
    };
  }

  //TODO
  //eslint-disable-next-line no-console
  console.log({ environmentVariables });

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

const envTwilioSendingPhoneNumber = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.texting.twilio.sendingPhoneNumber.production;
    case "sandbox":
      return config.vendors.texting.twilio.sendingPhoneNumber.sandbox;
    case "staging":
      return config.vendors.texting.twilio.sendingPhoneNumber.staging;
    case "development":
      return config.vendors.texting.twilio.sendingPhoneNumber.development;
    default:
      return "";
  }
};

const envPublicKeyUrl = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.publicKeyUrls.production;
    case "sandbox":
      return config.publicKeyUrls.sandbox;
    case "staging":
      return config.publicKeyUrls.staging;
    case "development":
      return config.publicKeyUrls.development;
    default:
      return "";
  }
};

const envTwilioTestReceivingPhoneNumber = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.texting.twilio.testReceivingPhoneNumber.production;
    case "sandbox":
      return config.vendors.texting.twilio.testReceivingPhoneNumber.sandbox;
    case "staging":
      return config.vendors.texting.twilio.testReceivingPhoneNumber.staging;
    case "development":
      return config.vendors.texting.twilio.testReceivingPhoneNumber.development;
    default:
      return "";
  }
};

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

const configMemory = ({ config, blossmConfig }) => {
  if (config.memory) return config.memory;
  return (
    blossmConfig.vendors.cloud.gcp.defaults.memoryOverrides[config.procedure] ||
    blossmConfig.vendors.cloud.gcp.defaults.memory
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
  await copy(scripts, workingDir);
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
  await copy(template, workingDir);
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
  await copy(srcDir, workingDir, {
    clobber: false
  });
};

const topicsForDependencies = (config, events) => {
  const array = (events || [])
    .map(e => `did-${e.action}.${e.domain}.${e.service || config.service}`)
    .concat(
      (config.procedure == "command-gateway" &&
        config.commands.some(
          c => c.protection == undefined || c.protection == "strict"
        )) ||
        (config.procedure == "view-gateway" &&
          config.stores.some(
            s => s.protection == undefined || s.protection == "strict"
          )) ||
        (config.procedure == "fact-gateway" &&
          config.jobs.some(
            j => j.protection == undefined || j.protection == "strict"
          ))
        ? [
            "did-start.session.core",
            "did-upgrade.session.core",
            "did-register.identity.core",
            "did-create.role.core",
            "did-add-roles.principle.core"
          ]
        : []
    );
  return [...new Set(array)];
};

const eventStoreDependencies = ({ dependencies }) => {
  let result = [];
  for (const dependency of dependencies) {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ dependency });
    if (
      dependency.procedure == "command" &&
      ![...dependencies, ...result].some(
        d =>
          d.procedure == "event-store" &&
          d.domain == dependency.domain &&
          d.service == dependency.service
      )
    ) {
      result.push({
        procedure: "event-store",
        service: dependency.service,
        domain: dependency.domain
      });
    }
  }
  //TODO
  //eslint-disable-next-line no-console
  console.log({ result });
  return result;
};

const addDefaultDependencies = ({ config, coreNetwork }) => {
  const tokenDependencies = [
    {
      name: "upgrade",
      domain: "session",
      service: "core",
      network: coreNetwork,
      procedure: "command"
    },
    {
      domain: "session",
      service: "core",
      network: coreNetwork,
      procedure: "event-store"
    },
    {
      domain: "role",
      service: "core",
      network: coreNetwork,
      procedure: "event-store"
    },
    {
      domain: "principle",
      service: "core",
      network: coreNetwork,
      procedure: "event-store"
    },
    {
      domain: "identity",
      service: "core",
      network: coreNetwork,
      procedure: "event-store"
    }
  ];

  switch (config.procedure) {
    case "command":
      return [
        ...config.testing.dependencies,
        ...eventStoreDependencies({
          dependencies: config.testing.dependencies
        }),
        {
          domain: config.domain,
          service: config.service,
          procedure: "event-store"
        }
      ];
    case "projection":
      return [
        ...config.testing.dependencies,
        {
          name: config.name,
          domain: config.domain,
          service: config.service,
          procedure: "view-store"
        }
      ];
    case "command-gateway": {
      const dependencies = [
        ...(config.commands.some(
          c => c.protection == undefined || c.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.commands
          .filter(c => c.network == undefined)
          .map(command => {
            return {
              name: command.name,
              domain: config.domain,
              service: config.service,
              procedure: "command"
            };
          })
      ];
      return [...eventStoreDependencies({ dependencies }), ...dependencies];
    }
    case "view-gateway":
      return [
        ...tokenDependencies,
        ...(config.stores.some(
          s => s.protection == undefined || s.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.stores
          .filter(s => s.network == undefined)
          .map(store => {
            return {
              name: store.name,
              domain: config.domain,
              service: config.service,
              procedure: "view-store"
            };
          })
      ];
    case "fact-gateway":
      return [
        ...tokenDependencies,
        ...(config.jobs.some(
          j => j.protection == undefined || j.protection == "strict"
        )
          ? tokenDependencies
          : []),
        ...config.jobs
          .filter(j => j.network == undefined)
          .map(job => {
            return {
              name: job.name,
              domain: config.domain,
              service: config.service,
              procedure: "fact"
            };
          })
      ];
    default:
      return config.testing.dependencies;
  }
};

const writeConfig = ({ config, coreNetwork, workingDir }) => {
  const newConfigPath = path.resolve(workingDir, "config.json");
  if (!config.testing) config.testing = {};
  if (!config.testing.dependencies) config.testing.dependencies = [];

  const { dependencies, events } = resolveTransientInfo(
    addDefaultDependencies({ config, coreNetwork })
  );

  //TODO
  //eslint-disable-next-line no-console
  console.log({ allDeps: dependencies });

  config.testing = {
    ...config.testing,
    dependencies,
    topics: topicsForDependencies(config, events)
  };

  delete config.testing.events;

  fs.writeFileSync(newConfigPath, JSON.stringify(config));
};

const writePackage = ({ config, baseConfig, workingDir }) => {
  const dependencies = {
    ...baseConfig.dependencies,
    ...(config.dependencies || {})
  };
  const devDependencies = {
    ...baseConfig.devDependencies,
    ...config.devDependencies
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
      "test:integration": "mocha --recursive test/integration --timeout 40000"
    },
    dependencies,
    devDependencies
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

    const region =
      config["gcp-region"] || blossmConfig.vendors.cloud.gcp.defaults.region;
    const network = blossmConfig.network;
    const coreNetwork = (blossmConfig.core || {}).network || network;
    const dnsZone =
      config["gcp-dns-zone"] || blossmConfig.vendors.cloud.gcp.dnsZone;

    const domain = config.domain;
    const service = config.service;
    const context = config.context;
    const procedure = config.procedure;
    const name = config.name;
    const event = config.event;
    const actions = config.actions;

    const dependencyKeyEnvironmentVariables = envDependencyKeyEnvironmentVariables(
      { env, config: blossmConfig }
    );

    const rolesBucket = envRolesBucket({ env, config: blossmConfig });
    const secretBucket = envSecretsBucket({ env, config: blossmConfig });
    const publicKeyUrl = envPublicKeyUrl({ env, config: blossmConfig });

    const twilioSendingPhoneNumber = envTwilioSendingPhoneNumber({
      env,
      config: blossmConfig
    });
    const twilioTestReceivingPhoneNumber = envTwilioTestReceivingPhoneNumber({
      env,
      config: blossmConfig
    });
    const secretBucketKeyLocation = "global";
    const secretBucketKeyRing = "secrets-bucket";

    const containerRegistery = `us.gcr.io/${project}`;
    const coreContainerRegistery = blossmConfig.core
      ? envCoreContainerRegistry({
          env,
          config: blossmConfig
        })
      : containerRegistery;

    const mainContainerName = "main";

    //eslint-disable-next-line no-console
    console.log({ publicKeyUrl, coreContainerRegistery });

    writeConfig({ config, coreNetwork, workingDir });

    writeBuild({
      workingDir,
      configFn,
      env,
      publicKeyUrl,
      region,
      domain,
      context,
      name,
      event,
      project,
      procedure,
      network,
      memory: configMemory({ config, blossmConfig }),
      mongodbUser: envMongodbUser({ env, config: blossmConfig, procedure }),
      mongodbHost: envMongodbHost({ env, config: blossmConfig, procedure }),
      mainContainerName,
      containerRegistery,
      twilioSendingPhoneNumber,
      twilioTestReceivingPhoneNumber,
      envUriSpecifier: envUriSpecifier(env),
      computeUrlId: envComputeUrlId({ env, config: blossmConfig }),
      dnsZone,
      service,
      rolesBucket,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      coreNetwork,
      actions,
      strict,
      dependencyKeyEnvironmentVariables,
      ...configFn(config)
    });

    writeCompose({
      config,
      workingDir,
      publicKeyUrl,
      procedure,
      port: 80,
      mainContainerName,
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
      event,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      twilioSendingPhoneNumber,
      twilioTestReceivingPhoneNumber,
      dependencyKeyEnvironmentVariables,
      ...configFn(config)
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
  configFn
}) => {
  await copyTemplate(__dirname, workingDir);
  await copyScript(scriptDir, workingDir);
  await copySource(path, workingDir);
  await configure(workingDir, configFn, env, !dry);
};
