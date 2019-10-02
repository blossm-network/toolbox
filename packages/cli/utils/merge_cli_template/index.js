const roboSay = require("@sustainers/robo-say");
const fs = require("fs-extra");
const ncp = require("ncp");
const { promisify } = require("util");
const { spawnSync } = require("child_process");
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

const convertPackage = async workingDir => {
  const dependenciesPath = path.resolve(workingDir, "dependencies.yaml");

  try {
    const package = {
      main: "index.js",
      scripts: {
        start: "node index.js",
        test: "mocha --recursive || exit 0"
      },
      ...yaml.parse(fs.readFileSync(dependenciesPath, "utf8"))
    };

    const packagePath = path.resolve(workingDir, "package.json");
    fs.writeFileSync(packagePath, JSON.stringify(package));
  } catch (e) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "The dependencies.yaml file isn't parseable. Double check it's correct and give it another go."
      ),
      red.bold("error")
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
};

const convertConfig = async workingDir => {
  const op = spawnSync("any-json", ["config.yaml", "config.json"], {
    cwd: workingDir
  });
  if (op.failed) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "Your config.yaml isn't parseable. Make sure it's formatted correctly and give it another go."
      ),
      red.bold("error")
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
};

const configure = async workingDir => {
  const configPath = path.resolve(workingDir, "config.json");
  const config = require(configPath);

  const buildPath = path.resolve(workingDir, "build.yaml");
  const build = yaml.parse(fs.readFileSync(buildPath, "utf8"));

  build.substitutions = {
    ...build.substitutions,
    _ID: config.id,
    _DOMAIN: config.domain,
    ...(config.service && { _SERVICE: config.service }),
    ...(config.network && { _NETWORK: config.network }),
    ...(config.gcpProject && { _GCP_PROJECT: config.gcpProject }),
    ...(config.gcpRegion && { _GCP_REGION: config.gcpRegion }),
    ...(config.gcpDnsZone && { _GCP_DNS_ZONE: config.gcpDnsZone }),
    ...(config.memory && { _MEMORY: config.memory })
  };

  fs.writeFileSync(buildPath, yaml.stringify(build));
};

module.exports = async (templateDir, workingDir, input) => {
  await copyTemplate(templateDir, workingDir);
  await copySrc(input.path, workingDir);
  await convertPackage(workingDir);
  await convertConfig(workingDir);
  await configure(workingDir);
};
