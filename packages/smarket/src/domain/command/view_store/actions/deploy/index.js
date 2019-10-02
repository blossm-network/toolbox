const normalize = require("@sustainers/normalize-cli");
const roboSay = require("@sustainers/robo-say");
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
    console.error(
      roboSay(
        "Something is not working in my insides, I can't seem to find my own complete view store template! Reach out to bugs@sustainers.market please, it's in everyone's best interest.",
        red.bold("shucks")
      )
    );
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
    console.error(
      roboSay(
        "I couldn't make out the path you gave me. Double check it's correct and give it another go."
      ),
      red.bold("shucks")
    );
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
  //eslint-disable-next-line no-console
  console.log(
    roboSay(
      "Got it, you want me to deploy a view store. Hang tight while I crank this out."
    )
  );
  //eslint-disable-next-line no-console
  console.log(
    roboSay(
      "It might take 5 minutes or so, maybe 4 on a good day. Either way that's still practically magic."
    )
  );

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

  const workingDir = path.resolve(__dirname, "tmp");

  fs.mkdirSync(workingDir);
  await copyTemplate(workingDir);
  await copySrc(input.path, workingDir);
  await convertPackage(workingDir);
  await convertConfig(workingDir);
  await configure(workingDir);
  await deploy(workingDir, input.env);

  fs.removeSync(workingDir);

  //eslint-disable-next-line no-console
  console.log(roboSay("Gottem'"), green.bold("perfect"));
  //eslint-disable-next-line no-console
  console.log(
    roboSay(
      "Congrats again on a new view store, my writer boss want's me to convey to you legitimate stoke."
    )
  );
  //eslint-disable-next-line no-console
  console.log(roboSay("I'll be here whenever you need me next."));
};
