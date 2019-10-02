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
  //eslint-disable-next-line no-console
  console.log("template dir: ", template);
  try {
    await access(template, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "Something is not working in my insides, I can't seem to find my own complete view store template! Reach out to bugs@sustainers.market please, it's in everyone's best interest.",
        red.bold("shucks")
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
        "I couldn't make out the path you gave me. Double check it's correct and give it another go."
      ),
      red.bold("shucks")
    );
    fs.removeSync(workingDir);
    process.exit(1);
  }
  await copy(srcDir, workingDir, { clobber: false });
};

const convertPackage = async workingDir => {
  const dependenciesPath = path.resolve(workingDir, "dependencies.json");

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
};

const convertConfig = async workingDir => {
  const op = spawnSync("any-json", ["config.yaml", "config.json"], {
    cwd: workingDir
  });
  if (op.failed) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "Rats! I couldn't read your config.yaml. Make sure it's formatted correctly and give it another go. If you think I've got a bug in me, reach out to bugs@sustainers.market please and thank youu"
      ),
      red.bold("shucks")
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
