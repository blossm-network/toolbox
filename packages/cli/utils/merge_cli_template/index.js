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

const envMongodbUser = ({ env, config, context }) => {
  switch (context) {
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

const envMongodbHost = ({ env, config, context }) => {
  switch (context) {
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
    blossmConfig.vendors.cloud.gcp.defaults.memoryOverrides[config.context] ||
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

const topicsForProcedures = (config, events) => {
  const array = (events || [])
    .map(e => `did-${e.action}.${e.domain}.${e.service || config.service}`)
    .concat(
      config.context == "command-handler"
        ? config.testing.events
          ? config.testing.events.map(
              e => `did-${e.action}.${e.domain}.${e.service}`
            )
          : [`did-${config.action}.${config.domain}.${config.service}`]
        : []
    )
    .concat(
      config.context == "command-gateway" || config.context == "view-gateway"
        ? [
            "did-start.session.core",
            "did-upgrade.session.core",
            "did-register.identity.core",
            "did-add-permissions.principle.core"
          ]
        : []
    );
  return [...new Set(array)];
};

const eventStoreProcedures = ({ procedures }) => {
  let result = [];
  for (const procedure of procedures) {
    if (
      procedure.context == "command-handler" &&
      ![...procedures, ...result].some(
        p => p.context == "event-store" && p.domain == procedure.domain
      )
    ) {
      result.push({ context: "event-store", domain: procedure.domain });
    }
  }
  return result;
};

const addDefaultProcedures = ({ config }) => {
  const tokenProcedures = [
    {
      action: "upgrade",
      domain: "session",
      context: "command-handler"
    },
    {
      domain: "session",
      context: "event-store"
    },
    {
      domain: "principle",
      context: "event-store"
    },
    {
      domain: "identity",
      context: "event-store"
    }
  ];

  switch (config.context) {
    case "command-handler":
      return [
        ...config.testing.procedures,
        ...eventStoreProcedures({ procedures: config.testing.procedures }),
        { domain: config.domain, context: "event-store" }
      ];
    case "projection":
      return [
        ...config.testing.procedures,
        { name: config.name, domain: config.domain, context: "view-store" }
      ];
    case "command-gateway": {
      const procedures = [
        ...tokenProcedures,
        ...config.commands.map(command => {
          return {
            name: command.name,
            domain: config.domain,
            context: "command-handler"
          };
        })
      ];
      return [...eventStoreProcedures({ procedures }), ...procedures];
    }
    case "view-gateway":
      return [
        ...tokenProcedures,
        ...config.stores.map(store => {
          return {
            name: store.name,
            domain: config.domain,
            context: "view-store"
          };
        })
      ];
    default:
      return config.testing.procedures;
  }
};

const writeConfig = (config, workingDir) => {
  const newConfigPath = path.resolve(workingDir, "config.json");
  if (!config.testing) config.testing = {};
  if (!config.testing.procedures) config.testing.procedures = [];

  const { procedures, events } = resolveTransientInfo(
    addDefaultProcedures({ config })
  );

  config.testing = {
    ...config.testing,
    procedures,
    topics: topicsForProcedures(config, events)
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
    writeConfig(config, workingDir);

    const blossmConfig = rootDir.config();
    const project = envProject({ env, config: blossmConfig });

    const region =
      config["gcp-region"] || blossmConfig.vendors.cloud.gcp.defaults.region;
    const network = config.network || blossmConfig.network;
    const dnsZone =
      config["gcp-dns-zone"] || blossmConfig.vendors.cloud.gcp.dnsZone;

    const domain = config.domain;
    const service = config.service;
    const context = config.context;
    const name = config.name;
    const event = config.event;
    const actions = config.actions;

    const secretBucket = envSecretsBucket({ env, config: blossmConfig });
    const secretBucketKeyLocation = "global";
    const secretBucketKeyRing = "secret-bucket";

    const containerRegistery = `us.gcr.io/${project}`;

    const mainContainerName = "main";

    writeBuild({
      workingDir,
      configFn,
      env,
      region,
      domain,
      name,
      event,
      project,
      context,
      network,
      memory: configMemory({ config, blossmConfig }),
      mongodbUser: envMongodbUser({ env, config: blossmConfig, context }),
      mongodbHost: envMongodbHost({ env, config: blossmConfig, context }),
      mainContainerName,
      containerRegistery,
      envUriSpecifier: envUriSpecifier(env),
      dnsZone,
      service,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      actions,
      strict,
      ...configFn(config)
    });

    writeCompose({
      config,
      workingDir,
      context,
      port: 80,
      mainContainerName,
      network: "local",
      service,
      project,
      region,
      containerRegistery,
      domain,
      name,
      event,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing
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

module.exports = async ({ scriptDir, workingDir, input, configFn }) => {
  await copyTemplate(__dirname, workingDir);
  await copyScript(scriptDir, workingDir);
  await copySource(input.path, workingDir);
  await configure(workingDir, configFn, input.env, !input.allowFail);
};
