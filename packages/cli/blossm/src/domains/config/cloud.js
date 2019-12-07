const normalize = require("@blossm/normalize-cli");
const rootDir = require("@blossm/cli-root-dir");
const { prompt } = require("inquirer");
const roboSay = require("@blossm/robo-say");

const vendors = ["gcp"];

module.exports = async args => {
  const input = await normalize({
    entrypointType: "vendor",
    choices: vendors,
    args,
    flags: [
      {
        name: "project",
        short: "p",
        type: String
      },
      {
        name: "region",
        short: "r",
        type: String
      },
      {
        name: "memory",
        short: "m",
        type: String
      },
      {
        name: "dnsZone",
        short: "d",
        type: String
      }
    ]
  });

  if (!input.project) {
    const { project } = await prompt({
      type: "string",
      name: "project",
      message: roboSay(
        `What's the root name of your gcp project? (Blossm will assume the full project name is \`{root}-{NODE_ENV}\`, where NODE_ENV is either "production", "sandbox", or "staging".)`
      )
    });
    input.project = project;
  }
  if (!input.region) {
    const { region } = await prompt({
      type: "list",
      name: "region",
      choices: ["us-central1", "us-east1", "europe-west1", "asia-northeast1"],
      message: roboSay(
        `What's the default region that your services should run in?`
      )
    });
    input.region = region;
  }
  if (!input.memory) {
    const { memory } = await prompt({
      type: "list",
      name: "memory",
      choices: ["128Mi", "256Mi", "512Mi", "1Gi", "2Gi"],
      message: roboSay(
        `What's the default amount of memory to give to your services? (Remember, the more, the pricier.)`
      )
    });
    input.memory = memory;
  }
  if (!input.dnsZone) {
    const { dnsZone } = await prompt({
      type: "string",
      name: "dnsZone",
      message: roboSay(
        `In what DNS zone should domain name records be created in?`
      )
    });
    input.dnsZone = dnsZone;
  }

  switch (input.vendor) {
    case "gcp":
      {
        rootDir.saveConfig({
          vendors: {
            cloud: {
              gcp: {
                ...(input.project && { project: input.project }),
                ...(input.region && { region: input.region }),
                ...(input.memory && { memory: input.memory }),
                ...(input.dnsZone && { dnsZone: input.dnsZone })
              }
            }
          }
        });
      }
      break;
  }
};
