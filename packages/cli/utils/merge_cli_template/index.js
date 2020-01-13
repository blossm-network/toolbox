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
      return `${env}.`;
    default:
      return "";
  }
};

const envNameSpecifier = env => {
  switch (env) {
    case "sandbox":
    case "staging":
      return `-${env}`;
    default:
      return "";
  }
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
        ? config.events
          ? config.events.map(e => `did-${e.action}.${e.domain}.${e.service}`)
          : [`did-${config.action}.${config.domain}.${config.service}`]
        : []
    )
    .concat(
      config.context == "command-gateway" || config.context == "view-gateway"
        ? ["did-issue.challenge.core", "did-answer.challenge.core"]
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
      action: "answer",
      domain: "challenge",
      context: "command-handler"
    },
    {
      action: "issue",
      domain: "challenge",
      context: "command-handler"
    },
    {
      domain: "challenge",
      context: "event-store"
    },
    {
      name: "permissions",
      domain: "principle",
      context: "view-store"
    },
    {
      name: "codes",
      domain: "challenge",
      context: "view-store"
    },
    {
      name: "phones",
      domain: "user",
      context: "view-store"
    },
    {
      name: "contexts",
      domain: "user",
      context: "view-store"
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
            action: command.action,
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

  //eslint-disable-next-line
  console.log("procedures is: ", config.testing.procedures);
  //eslint-disable-next-line
  console.log(
    "add defaults procedures give me: ",
    addDefaultProcedures({ config })
  );

  const { procedures, events } = resolveTransientInfo(
    addDefaultProcedures({ config })
  );
  //eslint-disable-next-line
  console.log("resolving transients give me: ", { procedures, events });

  config.testing = {
    ...config.testing,
    procedures: config.testing.procedures
      ? [...config.testing.procedures, ...procedures]
      : []
  };

  config.testing.topics = topicsForProcedures(config, events);

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

const configure = async (workingDir, configFn, env) => {
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

    const region =
      config["gcp-region"] || blossmConfig.vendors.cloud.gcp.region;
    const project =
      config["gcp-project"] || blossmConfig.vendors.cloud.gcp.project;
    const network = config.network || blossmConfig.network;
    const dnsZone =
      config["gcp-dns-zone"] || blossmConfig.vendors.cloud.gcp.dnsZone;

    const memory = config.memory || blossmConfig.vendors.cloud.gcp.memory;
    const domain = config.domain;
    const service = config.service;
    const context = config.context;
    const action = config.action;
    const name = config.name;
    const event = config.event;

    const secretBucket = env =>
      `${blossmConfig.vendors.cloud.gcp.secretsBucket}${envNameSpecifier(
        env
      )}-secrets`;
    const secretBucketKeyLocation = "global";
    const secretBucketKeyRing = "secret-bucket";

    const containerRegistery = `us.gcr.io/${project}${envNameSpecifier(env)}`;

    const mainContainerName = "main";

    writeBuild({
      workingDir,
      configFn,
      env,
      region,
      domain,
      action,
      name,
      event,
      project,
      context,
      network,
      memory,
      mainContainerName,
      containerRegistery,
      envUriSpecifier: envUriSpecifier(env),
      envNameSpecifier: envNameSpecifier(env),
      dnsZone,
      service,
      secretBucket: secretBucket(env),
      secretBucketKeyLocation,
      secretBucketKeyRing,
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
      action,
      event,
      secretBucket: secretBucket("staging"),
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
  await configure(workingDir, configFn, input.env);
};
