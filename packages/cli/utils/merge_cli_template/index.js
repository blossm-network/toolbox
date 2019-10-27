const roboSay = require("@sustainers/robo-say");
const hash = require("@sustainers/hash-string");
const fs = require("fs-extra");
const ncp = require("ncp");
const { promisify } = require("util");
const yaml = require("yaml");
const path = require("path");
const { red } = require("chalk");

const access = promisify(fs.access);
const copy = promisify(ncp);

const copyTemplate = async (templateDir, workingDir) => {
  const template = path.resolve(templateDir, "template");
  try {
    await access(template, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "Full view store template not found. Reach out to bugs@sustainers.market please, it's in everyone's best interest.",
        red.bold("internal error")
      )
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
  await copy(template, workingDir);
};

const copySrc = async (p, workingDir) => {
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
  await copy(srcDir, workingDir, { clobber: false });
};

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

const writeConfig = (config, workingDir) => {
  const newConfigPath = path.resolve(workingDir, "config.json");
  fs.writeFileSync(newConfigPath, JSON.stringify(config));
};

const writePackage = (config, workingDir) => {
  const package = {
    main: "index.js",
    scripts: {
      start: "node index.js",
      "test:unit": "mocha --recursive test/unit",
      "test:integration": "mocha --recursive test/integration"
    },
    dependencies: config.dependencies,
    devDependencies: config.devDependencies
  };
  const packagePath = path.resolve(workingDir, "package.json");
  fs.writeFileSync(packagePath, JSON.stringify(package));
};

const writeBuild = (config, workingDir, configFn, env) => {
  const buildPath = path.resolve(workingDir, "build.yaml");
  const build = yaml.parse(fs.readFileSync(buildPath, "utf8"));

  build.substitutions = {
    ...build.substitutions,

    ...(config.domain && { _DOMAIN: config.domain }),
    ...(config.service && { _SERVICE: config.service }),
    ...(config.context && { _CONTEXT: config.context }),
    ...(config.network && { _NETWORK: config.network }),
    ...(config["gcp-project"] && { _GCP_PROJECT: config }),
    ...(config["gcp-region"] && { _GCP_REGION: config["gcp-region"] }),
    ...(config["gcp-dns-zone"] && {
      _GCP_DNS_ZONE: config["gcp-dns-zone"]
    }),
    ...(config.memory && { _MEMORY: config.memory }),

    ...(configFn && configFn(config)),

    _NODE_ENV: env,
    _ENV_NAME_SPECIFIER: envNameSpecifier(env),
    _ENV_URI_SPECIFIER: envUriSpecifier(env)
  };
  fs.writeFileSync(buildPath, yaml.stringify(build));
};

const writeCompose = (config, workingDir) => {
  if (!config.targets) return;

  const composePath = path.resolve(workingDir, "docker-compose.yml");
  const compose = yaml.parse(fs.readFileSync(composePath, "utf8"));

  const containerRegistry = "us.gcr.io/${GCP_PROJECT}";
  const common = { ports: ["${PORT}"] };
  const commonEnvironment = {
    PORT: "${PORT}",
    NODE_ENV: "${NODE_ENV}",
    NETWORK: "${NETWORK}",
    SERVICE: "${SERVICE}",
    GCP_PROJECT: "${GCP_PROJECT}",
    GCP_REGION: "${GCP_REGION}",
    GCP_SECRET_BUCKET: "${GCP_SECRET_BUCKET}",
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION: "${GCP_KMS_SECRET_BUCKET_KEY_LOCATION}",
    GCP_KMS_SECRET_BUCKET_KEY_RING: "${GCP_KMS_SECRET_BUCKET_KEY_RING}"
  };
  const commonStoreEnvironment = {
    MONGODB_USER: "${MONGODB_USER}",
    MONGODB_HOST: "${MONGODB_HOST}"
  };

  let services = {};
  const dependsOn = [];
  for (const target of config.targets) {
    switch (target.context) {
    case "view-store":
      {
        const targetHash = hash(
          target.name + target.domain + target.context + config.service
        ).toString();

        const key = `${target.name}-${target.domain}-${config.service}`;
        services = {
          ...services,
          [key]: {
            ...common,
            image: `${containerRegistry}/\${SERVICE}.${target.context}.${target.domain}.${target.name}:latest`,
            container_name: `${targetHash}.\${NETWORK}`,
            environment: {
              ...commonEnvironment,
              ...commonStoreEnvironment,
              CONTEXT: target.context,
              DOMAIN: target.domain,
              NAME: target.name
            }
          }
        };
        dependsOn.push(key);
      }
      break;
    case "event-store":
      {
        const targetHash = hash(
          target.domain + target.context + config.service
        ).toString();

        const key = `${target.domain}-${config.service}`;
        services = {
          ...services,
          [key]: {
            ...common,
            image: `${containerRegistry}/\${SERVICE}.${target.context}.${target.domain}:latest`,
            container_name: `${targetHash}.\${NETWORK}`,
            environment: {
              ...commonEnvironment,
              ...commonStoreEnvironment,
              CONTEXT: target.context,
              DOMAIN: target.domain
            }
          }
        };
        dependsOn.push(key);
      }
      break;
    case "command-handler":
      {
        const targetHash = hash(
          target.action + target.domain + target.context + config.service
        ).toString();
        const key = `${target.action}-${target.domain}-${config.service}`;
        services = {
          ...services,
          [key]: {
            ...common,
            image: `${containerRegistry}/\${SERVICE}.${target.context}.${target.domain}.${target.action}:latest`,
            container_name: `${targetHash}.\${NETWORK}`,
            environment: {
              ...commonEnvironment,
              CONTEXT: target.context,
              DOMAIN: target.domain,
              ACTION: target.action
            }
          }
        };
        dependsOn.push(key);
      }
      break;
    }
  }

  compose.services = {
    main: {
      ...compose.services.main,
      depends_on: dependsOn
    },
    ...services
  };

  fs.writeFileSync(composePath, yaml.stringify(compose));
};

const configure = async (workingDir, configFn, env) => {
  const configPath = path.resolve(workingDir, "blossom.yaml");

  try {
    const config = yaml.parse(fs.readFileSync(configPath, "utf8"));
    //Write package.json
    writePackage(config, workingDir);
    delete config.dependencies;
    delete config.devDependencies;
    writeConfig(config, workingDir);
    writeBuild(config, workingDir, configFn, env);
    writeCompose(config, workingDir);
  } catch (e) {
    //eslint-disable-next-line no-console
    console.error(e);
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "blossom.yaml isn't parseable. Double check it's correct and give it another go."
      ),
      red.bold("error")
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
};

module.exports = async ({ templateDir, workingDir, input, configFn }) => {
  await copyTemplate(templateDir, workingDir);
  await copySrc(input.path, workingDir);
  await configure(workingDir, configFn, input.env);
};
