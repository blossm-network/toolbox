const fs = require("fs-extra");
const path = require("path");
const yaml = require("yaml");
// const { prompt } = require("inquirer");
const normalize = require("@blossm/normalize-cli");
// const roboSay = require("@blossm/robo-say");
// const rootDir = require("@blossm/cli-root-dir");

const projectionMatches = ({ name, context, domain, service }, config) => {
  if (config.procedure != "projection") return false;
  if (config.name != name) return false;
  if (config.context != context) return false;
  if (domain && config.domain != domain) return false;
  if (service && config.service != service) return false;
  return true;
};

const replay = async (input) => {
  const blossmDir = path.resolve(process.cwd(), input.dir || "");
  const blossmConfig = yaml.parse(fs.readFileSync(blossmDir, "utf8"));

  //TODO
  //eslint-disable-next-line no-console
  console.log({
    name: blossmConfig.name,
    context: blossmConfig.context,
    ...(blossmConfig.domain && { domain: blossmConfig.domain }),
    ...(blossmConfig.service && { service: blossmConfig.service }),
  });
  const allEvents = findProjections({
    name: blossmConfig.name,
    context: blossmConfig.context,
    ...(blossmConfig.domain && { domain: blossmConfig.domain }),
    ...(blossmConfig.service && { service: blossmConfig.service }),
  });

  //TODO
  //eslint-disable-next-line no-console
  console.log({ allEvents });
};

const findProjections = ({ name, context, domain, service }, dir) => {
  const all = [];
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);

    if (file == "blossm.yaml" || file == "blossm.yml") {
      const blossmConfig = yaml.parse(fs.readFileSync(filePath, "utf8"));
      if (projectionMatches({ name, context, domain, service }, blossmConfig))
        all.push(blossmConfig.events);
    } else if (fs.statSync(filePath).isDirectory()) {
      const events = findProjections(
        { name, context, domain, service },
        filePath
      );
      if (events) all.push(events);
    }
  }

  return all;
};

module.exports = async (args) => {
  const input = await normalize({
    entrypointType: "dir",
    default: "blossm",
    args,
  });

  replay(input);
};
