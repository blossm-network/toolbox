const fs = require("fs-extra");
const path = require("path");
const yaml = require("yaml");
// const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const { red } = require("chalk");
const rootDir = require("@blossm/cli-root-dir");
const { spawnSync } = require("child_process");

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

const projectionMatches = ({ name, context, domain, service }, config) => {
  if (config.procedure != "projection") return false;
  if (config.name != name) return false;
  if (config.context != context) return false;
  if (domain && config.domain != domain) return false;
  if (service && config.service != service) return false;
  return true;
};

const replay = async (input) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log("hey");

  const storePath = path.resolve(
    process.cwd(),
    input.path || "",
    "blossm.yaml"
  );
  const blossmConfig = yaml.parse(fs.readFileSync(storePath, "utf8"));

  //TODO
  //eslint-disable-next-line no-console
  console.log({
    procedure: blossmConfig.procedure,
    name: blossmConfig.name,
    context: blossmConfig.context,
    ...(blossmConfig.domain && { domain: blossmConfig.domain }),
    ...(blossmConfig.service && { service: blossmConfig.service }),
  });
  if (blossmConfig.procedure != "view-store") {
    roboSay(
      "This directory doesn't seem to be a view store that can be replayed."
    );
    red.bold("error");
    return;
  }

  const allEvents = findProjections(
    {
      name: blossmConfig.name,
      context: blossmConfig.context,
      ...(blossmConfig.domain && { domain: blossmConfig.domain }),
      ...(blossmConfig.service && { service: blossmConfig.service }),
    },
    rootDir.path()
  );

  //TODO
  //eslint-disable-next-line no-console
  console.log({ allEvents });

  const e = allEvents[0];

  try {
    const spawnCall = spawnSync(
      "gcloud",
      [
        "functions",
        "call",
        "replay-projection",
        `--data=${JSON.stringify({
          projection: {
            name: blossmConfig.name,
            context: blossmConfig.context,
            eventsDomain: e.domain,
            eventsService: e.service,
          },
          root: "asdf",
        })}`,
        `--project=${envProject({ config: rootDir.config(), env: input.env })}`,
      ],
      {
        stdio: [process.stdin, process.stdout, process.stderr],
        cwd: process.cwd(),
      }
    );
    //TODO
    //eslint-disable-next-line no-console
    console.log({ spawnCall });

    if (spawnCall.stderr) {
      process.exitCode = 1;
      throw "Couldn't call replay.";
    }
  } catch (e) {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ e });
  }
};

const findProjections = ({ name, context, domain, service }, dir) => {
  const all = [];
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);

    if (file == "blossm.yaml" || file == "blossm.yml") {
      const blossmConfig = yaml.parse(fs.readFileSync(filePath, "utf8"));
      if (projectionMatches({ name, context, domain, service }, blossmConfig)) {
        //TODO
        //eslint-disable-next-line no-console
        console.log({ found: blossmConfig.events });
        all.push(blossmConfig.events);
      }
    } else if (fs.statSync(filePath).isDirectory()) {
      const allEvents = findProjections(
        { name, context, domain, service },
        filePath
      );
      all.push(...allEvents);
    }
  }

  return all;
};

module.exports = async (args) => {
  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: ".",
    args,
  });

  replay(input);
};
