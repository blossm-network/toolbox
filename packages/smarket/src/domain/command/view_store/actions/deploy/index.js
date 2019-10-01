const normalize = require("@sustainers/normalize-cli");
const fs = require("fs-extra");
const { spawnSync } = require("child_process");
const yaml = require("yaml");
const ncp = require("ncp");
const path = require("path");
const { green, red } = require("chalk");
const { promisify } = require("util");

const access = promisify(fs.access);
const copy = promisify(ncp);

const copyTemplate = async workingDir => {
  const templateDir = path.resolve(__dirname, "template");
  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error("%s Invalid template name", red.bold("ERROR"));
    process.exit(1);
  }
  await copy(`${templateDir}`, workingDir);
};

const copySrc = async (p, workingDir) => {
  const srcDir = path.resolve(process.cwd(), p);
  try {
    await access(srcDir, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error("%s Invalid path", red.bold("ERROR"));
    process.exit(1);
  }
  await copy(srcDir, workingDir, { clobber: false });
};

const convertPackage = async workingDir => {
  const op = spawnSync("any-json", ["dependencies.yaml", "dependencies.json"], {
    cwd: workingDir
  });
  if (op.failed) {
    return Promise.reject(new Error("Failed to convert package to json"));
  }

  const dependenciesPath = path.resolve(workingDir, "dependencies.json");
  const packagePath = path.resolve(workingDir, "package.json");

  const package = {
    ...require(packagePath),
    ...require(dependenciesPath)
  };

  fs.writeFileSync(packagePath, JSON.stringify(package));
};

const convertConfig = async workingDir => {
  const op = spawnSync("any-json", ["config.yaml", "config.json"], {
    cwd: workingDir
  });
  if (op.failed) {
    return Promise.reject(new Error("Failed to convert config to json"));
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

const deploy = async (workingDir, env) => {
  const buildPath = path.resolve(workingDir, "build.yaml");
  const { substitutions } = yaml.parse(fs.readFileSync(buildPath, "utf8"));

  spawnSync(
    "gcloud",
    [
      "builds",
      "submit",
      ".",
      "--config=build.yaml",
      `--substitutions=_ENVIRONMENT=${env}`,
      `--project=${substitutions._GCP_PROJECT}`
    ],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir
    }
  );
};

module.exports = async args => {
  const input = await normalize({
    entrypointType: "path",
    args,
    flags: [
      {
        name: "env",
        type: String,
        short: "e",
        default: "staging"
      }
    ]
  });

  //eslint-disable-next-line no-console
  console.log("parsed input: ", { input });

  const workingDir = path.resolve(__dirname, "tmp");

  //eslint-disable-next-line no-console
  console.log("working dir will be: ", { workingDir });

  fs.mkdirSync(workingDir);
  //eslint-disable-next-line no-console
  console.log("dir made: ");
  await copyTemplate(workingDir);
  //eslint-disable-next-line no-console
  console.log("copied template");
  await copySrc(input.path, workingDir);
  //eslint-disable-next-line no-console
  console.log("copied src");
  await convertPackage(workingDir);
  //eslint-disable-next-line no-console
  console.log("converted src");
  await convertConfig(workingDir);
  //eslint-disable-next-line no-console
  console.log("converted config");
  await configure(workingDir);
  //eslint-disable-next-line no-console
  console.log("configured src");
  await deploy(workingDir, input.env);

  fs.removeSync(workingDir);

  //eslint-disable-next-line no-console
  console.log("%s Nice!", green.bold("DONE"));
};
