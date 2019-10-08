const roboSay = require("@sustainers/robo-say");
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
const configure = async (workingDir, configFn, env) => {
  const configPath = path.resolve(workingDir, "blossom.yaml");

  try {
    const config = yaml.parse(fs.readFileSync(configPath, "utf8"));

    //Write package.json
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

    //Write new config
    delete config.dependencies;
    delete config.devDependencies;
    const newConfigPath = path.resolve(workingDir, "config.json");
    fs.writeFileSync(newConfigPath, JSON.stringify(config));

    //Write build.yaml
    const buildPath = path.resolve(workingDir, "build.yaml");
    const build = yaml.parse(fs.readFileSync(buildPath, "utf8"));

    build.substitutions = {
      ...build.substitutions,

      ...(config.domain && { _DOMAIN: config.domain }),
      ...(config.service && { _DOMAIN: config.service }),
      ...(config.context && { _CONTEXT: config.context }),
      ...(config.network && { _NETWORK: config.network }),
      ...(config.gcpProject && { _GCP_PROJECT: config.gcpProject }),
      ...(config.gcpRegion && { _GCP_REGION: config.gcpRegion }),
      ...(config.gcpDnsZone && { _GCP_DNS_ZONE: config.gcpDnsZone }),
      ...(config.memory && { _MEMORY: config.memory }),

      ...(configFn && configFn(config)),

      _NODE_ENV: env,
      _ENV_NAME_SPECIFIER: envNameSpecifier(env),
      _ENV_URI_SPECIFIER: envUriSpecifier(env)
    };
    fs.writeFileSync(buildPath, yaml.stringify(build));
  } catch (e) {
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
