import normalize from "@blossm/normalize-cli";
import roboSay from "@blossm/robo-say";
import fs from "fs-extra";
import rootDir from "@blossm/cli-root-dir";
import path from "path";
import yaml from "yaml";
import { enqueue } from "@blossm/gcp-queue";

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

const envUriSpecifier = (env) => {
  switch (env) {
    case "sandbox":
      return "snd.";
    case "staging":
      return "stg.";
    case "development":
      return "dev.";
    default:
      return "";
  }
};

const envComputeUrlId = ({ env, config }) => {
  switch (env) {
    case "production":
      return config.vendors.cloud.gcp.computeUrlIds.production;
    case "sandbox":
      return config.vendors.cloud.gcp.computeUrlIds.sandbox;
    case "staging":
      return config.vendors.cloud.gcp.computeUrlIds.staging;
    case "development":
      return config.vendors.cloud.gcp.computeUrlIds.development;
    default:
      return "";
  }
};

const queueName = ({ config, data }) => {
  switch (config.procedure) {
    case "command":
      return `command-${config.service}-${config.domain}-${config.name}`;
    case "job":
      return `job-${config.service ? `-${config.service}` : ""}${
        config.domain ? `-${config.domain}` : ""
      }-${config.name}`;
    case "projection":
      return `projection${config.context ? `-${config.context}` : ""}-${
        config.name
      }-${data ? "play" : "replay"}`;
  }
};

const urlPath = ({ config, data }) =>
  config.procedure == "projection" && !data ? "replay" : "";

const execute = async (input, configFn) => {
  const functionPath = path.resolve(
    process.cwd(),
    input.path || "",
    "blossm.yaml"
  );
  const blossmConfig = yaml.parse(fs.readFileSync(functionPath, "utf8"));

  const { operationHash, operationName } = configFn(blossmConfig);

  const rootConfig = rootDir.config();

  try {
    const project = envProject({
      config: rootConfig,
      env: input.env,
    });

    const computeUrlId = envComputeUrlId({
      config: rootConfig,
      env: input.env,
    });

    await enqueue({
      queue:
        input.queue || queueName({ config: blossmConfig, data: input.data }),
      location: "us-central1",
      computeUrlId,
      project,
    })({
      url: `https://${operationHash}.${input.region}.${envUriSpecifier(
        input.env
      )}${rootConfig.network}/${urlPath({
        config: blossmConfig,
        data: input.data,
      })}`,
      name: operationName,
      hash: operationHash,
      ...(input.data && { data: JSON.parse(input.data) }),
    });
  } catch (err) {
    process.exitCode = 1;
    throw err;
  }
};

export default ({ domain }) => async (args, configFn) => {
  const blossmConfig = rootDir.config();
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
        default: blossmConfig.defaultEnv || "development",
      },
      {
        name: "data",
        type: String,
        short: "d",
      },
      {
        name: "region",
        type: String,
        short: "r",
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

  //eslint-disable-next-line no-console
  console.log(roboSay(`Executing your ${domain.split("-").join(" ")}.`));
  await execute(input, configFn);
};
