const normalize = require("@blossm/normalize-cli");
const roboSay = require("@blossm/robo-say");
const fs = require("fs-extra");
const { spawnSync } = require("child_process");
const rootDir = require("@blossm/cli-root-dir");
const path = require("path");
const yaml = require("yaml");

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

const execute = async (input, configFn) => {
  const functionPath = path.resolve(
    process.cwd(),
    input.path || "",
    "blossm.yaml"
  );
  const blossmConfig = yaml.parse(fs.readFileSync(functionPath, "utf8"));

  const { operationHash } = configFn(blossmConfig);

  const rootConfig = rootDir.config();

  try {
    const project = envProject({
      config: rootConfig,
      env: input.env,
    });

    const spawnCall = spawnSync(
      "gcloud",
      [
        "beta",
        "tasks",
        "create-http-task",
        input.name,
        `--queue=${input.queue}`,
        `--url=http://${operationHash}.${input.region}.${envUriSpecifier(
          input.env
        )}${rootConfig.network}`,
        `--oidc-service-account-email=executer@${project}.iam.gserviceaccount.com`,
        ...(input.data ? [`--body-content=${input.data}`] : []),
        `--project=${project}`,
      ],
      {
        stdio: [process.stdin, process.stdout, process.stderr],
        cwd: process.cwd(),
      }
    );

    if (spawnCall.stderr) {
      process.exitCode = 1;
      throw "Couldn't call execute.";
    }
  } catch (err) {
    process.exitCode = 1;
    throw err;
  }
};

module.exports = ({ domain }) => async (args, configFn) => {
  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: ".",
    args,
    flags: [
      {
        name: "name",
        type: String,
        short: "n",
        required: true,
      },
      {
        name: "queue",
        type: String,
        short: "q",
        required: true,
      },
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
