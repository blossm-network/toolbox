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
const resolveTransientTargets = require("./src/resolve_transient_targets");

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

const topicsForTargets = config => {
  const blossmConfig = rootDir.config();
  const array = (config.targets || [])
    .filter(t => t.context == "command-handler")
    .map(
      t =>
        `did-${t.action}.${t.domain}.${t.service || config.service}.${
          blossmConfig.network
        }`
    )
    .concat(
      config.context == "command-handler"
        ? [
            `did-${config.action}.${config.domain}.${config.service}.${blossmConfig.network}`
          ]
        : []
    );
  return [...new Set(array)];
};

const writeConfig = (config, workingDir) => {
  const newConfigPath = path.resolve(workingDir, "config.json");
  config.targets = config.targets
    ? [...config.targets, ...resolveTransientTargets(config.targets)]
    : [];

  config.topics = topicsForTargets(config);

  //eslint-disable-next-line
  console.log("topics: ", config.topics);

  fs.writeFileSync(newConfigPath, JSON.stringify(config));
};

const writePackage = (config, workingDir) => {
  const package = {
    main: "index.js",
    scripts: {
      start: "node index.js",
      "test:unit": "mocha --recursive test/unit",
      "test:integration": "mocha --recursive test/integration --timeout 20000"
    },
    dependencies: config.dependencies,
    devDependencies: config.devDependencies
  };
  const packagePath = path.resolve(workingDir, "package.json");
  fs.writeFileSync(packagePath, JSON.stringify(package));
};

const configure = async (workingDir, configFn, env) => {
  const configPath = path.resolve(workingDir, "blossm.yaml");

  try {
    const config = yaml.parse(fs.readFileSync(configPath, "utf8"));
    //Write package.json
    writePackage(config, workingDir);
    delete config.dependencies;
    delete config.devDependencies;
    writeConfig(config, workingDir);
    writeBuild({ config, workingDir, configFn, env });
    writeCompose(config, workingDir);
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
