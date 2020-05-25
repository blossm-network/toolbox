const fs = require("fs-extra");
const path = require("path");
const yaml = require("yaml");
const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const { red } = require("chalk");
const rootDir = require("@blossm/cli-root-dir");
const { spawnSync } = require("child_process");
const hash = require("@blossm/operation-hash");
const trim = require("@blossm/trim-string");
const { MAX_LENGTH } = require("@blossm/service-name-consts");

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

const execute = async (input) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log("yup");

  const functionPath = path.resolve(
    process.cwd(),
    input.path || "",
    "blossm.yaml"
  );
  const blossmConfig = yaml.parse(fs.readFileSync(functionPath, "utf8"));

  const operationHash = hash(blossmConfig.name, blossmConfig.procedure);
  const operationName = trim(
    `${blossmConfig.procedure}-${blossmConfig.name}`,
    MAX_LENGTH
  );
  const serviceName = `${input.region}-${operationName}-${operationHash}`;

  //TODO
  //eslint-disable-next-line no-console
  console.log({ serviceName });

  if (blossmConfig.procedure != "function") {
    roboSay(
      "This directory doesn't seem to be a function that can be executed."
    );
    red.bold("error");
    return;
  }

  try {
    const spawnCall = spawnSync(
      "gcloud",
      [
        "functions",
        "call",
        serviceName,
        ...(input.data ? [`--data=${input.data}`] : []),
        `--project=${envProject({
          config: rootDir.config(),
          env: input.env,
        })}`,
      ],
      {
        stdio: [process.stdin, process.stdout, process.stderr],
        cwd: process.cwd(),
      }
    );

    //TODO
    //eslint-disable-next-line no-console
    console.log({ out: spawnCall.stdout });

    if (spawnCall.stderr) {
      process.exitCode = 1;
      throw "Couldn't call replay.";
    }
  } catch (err) {
    process.exitCode = 1;
    throw err;
  }
};

module.exports = async (args) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log("executing");
  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: ".",
    args,
    flags: [
      {
        name: "env",
        type: String,
        short: "e",
        choices: ["production", "sandbox", "staging", "development"],
        default: "development",
      },
      {
        name: "data",
        type: String,
        short: "d",
      },
      {
        name: "region",
        type: String,
        short: "e",
        choices: [
          "asia-east1",
          "asia-east2",
          "asia-northeast1",
          "asia-northeast2",
          "asia-northeast3",
          "asia-south1",
          "asia-southeast1",
          "australia-southeast1",
          "europe-north1",
          "europe-west1",
          "europe-west2",
          "europe-west3",
          "europe-west4",
          "europe-west6",
          "northamerica-northeast1",
          "southamerica-east1",
          "us-central1",
          "us-east1",
          "us-east4",
          "us-west1",
          "us-west2",
          "us-west3",
          "us-west4",
        ],
        default: "us-central1",
      },
    ],
  });

  execute(input);
};
