const { stripIndents } = require("common-tags");

const nodeImage = "node:10.16.0";
const dockerComposeImage = "docker/compose:1.15.0";
const dockerImage = "gcr.io/cloud-builders/docker";
const gcloudImage = "gcr.io/cloud-builders/gcloud";

const yarnInstall = {
  name: nodeImage,
  entrypoint: "yarn",
  args: ["install"]
};
const unitTest = {
  name: nodeImage,
  entrypoint: "yarn",
  args: ["test:unit"]
};
const buildImage = ({ name }) => {
  return {
    name: dockerImage,
    args: ["build", "-t", `us.gcr.io/\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}/\${_SERVICE}.\${_CONTEXT}${name}`, "."]
  };
};
const writeEnv = {
  name: nodeImage,
  entrypoint: "bash",
  args: [
    "-c",
    stripIndents`
    cat >> .env <<- EOM
    NETWORK=local
    SERVICE=\${_SERVICE}
    CONTEXT=\${_CONTEXT}
    DOMAIN=\${_DOMAIN}
    OPERATION_HASH=\${_OPERATION_HASH}
    NAME=\${_NAME}
    NODE_ENV=local
    PORT=80
    MAIN_CONTAINER_NAME=main
    CONTAINER_REGISTRY=us.gcr.io/\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}
    GCP_PROJECT=\${_GCP_PROJECT}-staging
    GCP_REGION=\${_GCP_REGION}
    GCP_SECRET_BUCKET=smn-staging-secrets
    MONGODB_ADMIN_DATABASE=admin
    MONGODB_ADMIN_USER=admin
    MONGODB_ADMIN_USER_PASSWORD=password
    MONGODB_USER=tester
    MONGODB_USER_PASSWORD=password
    MONGODB_PROTOCOL=mongodb
    MONGODB_HOST=mongodb
    EOM`
  ]
};
const dockerComposeUp = {
  name: dockerComposeImage,
  args: ["up", "-d"]
};
const dockerComposeProcesses = {
  name: dockerComposeImage,
  args: ["ps"]
};

const integrationTests = env => {
  return {
    name: nodeImage,
    entrypoint: "yarn",
    args: ["test:integration"],
    env: ["MAIN_CONTAINER_NAME=main", "NETWORK=local", "SERVICE=${_SERVICE}", "CONTEXT=${_CONTEXT}", ...env]
  };
};
const dockerComposeLogs = {
  name: dockerComposeImage,
  args: ["logs"]
};

const dockerPush = ({ name }) => {
  return {
    name: dockerImage,
    args: ["push", `us.gcr.io/\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}/\${_SERVICE}.\${_CONTEXT}${name}`]
  };
};

const deployServer = ({ name, env, labels }) => {
  return {
    name: gcloudImage,
    args: [
      "beta",
      "run",
      "deploy",
      "${_GCP_REGION}-${_OPERATION_NAME}-${_OPERATION_HASH}",
      `--image=us.gcr.io/\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}/\${_SERVICE}.\${_CONTEXT}${name}`,
      "--platform=managed",
      "--memory=${_MEMORY}",
      "--project=${_GCP_PROJECT}${_ENV_NAME_SPECIFIER}",
      "--region=${_GCP_REGION}",
      `--set-env-vars=NODE_ENV=\${_NODE_ENV},NETWORK=\${_GCP_REGION}.\${_ENV_URI_SPECIFIER}\${_NETWORK},SERVICE=\${_SERVICE},CONTEXT=\${_CONTEXT},GCP_PROJECT=\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER},GCP_REGION=\${_GCP_REGION},GCP_SECRET_BUCKET=smn\${_ENV_NAME_SPECIFIER}-secrets,${env}`,
      `--labels=service=\${_SERVICE},context=\${_CONTEXT},hash=\${_OPERATION_HASH},${labels}`
    ]
  };
};

const startDnsTransaction = {
  name: gcloudImage,
  args: ["beta", "dns", "record-sets", "transaction", "start", "--zone=${_GCP_DNS_ZONE}", "--project=${_GCP_PROJECT}"]
};

const addDnsTransaction = {
  name: gcloudImage,
  args: [
    "beta",
    "dns",
    "record-sets",
    "transaction",
    "add",
    "ghs.googlehosted.com.",
    "--name=${_OPERATION_HASH}.${_GCP_REGION}.${_ENV_URI_SPECIFIER}${_NETWORK}",
    "--zone=${_GCP_DNS_ZONE}",
    "--type=CNAME",
    "--ttl=86400",
    "--project=${_GCP_PROJECT}"
  ]
};

const executeDnsTransaction = {
  name: gcloudImage,
  entrypoint: "bash",
  args: [
    "-c",
    stripIndents`
    gcloud beta dns record-sets transaction execute
    --zone=\${_GCP_DNS_ZONE}
    --project=\${_GCP_PROJECT} || exit 0`
  ]
};

const abortDnsTransaction = {
  name: gcloudImage,
  entrypoint: "bash",
  args: [
    "-c",
    stripIndents`
    gcloud beta dns record-sets transaction abort
    --zone=\${_GCP_DNS_ZONE}
    --project=\${_GCP_PROJECT} || exit 0`
  ]
};

const mapDomain = {
  name: gcloudImage,
  entrypoint: "bash",
  args: [
    "-c",
    stripIndents`
    gcloud beta run domain-mappings create
    --platform=managed
    --domain=\${_OPERATION_HASH}.\${_GCP_REGION}.\${_ENV_URI_SPECIFIER}\${_NETWORK}
    --service=\${_GCP_REGION}-\${_OPERATION_NAME}-\${_OPERATION_HASH}
    --project=\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}
    --region=\${_GCP_REGION} || exit 0`
  ]
};

module.exports = ({ config }) => {
  switch (config.context) {
    case "view-store": {
      const imageName = "${_DOMAIN}.${_NAME}";
      return [
        yarnInstall,
        unitTest,
        buildImage({ name: imageName }),
        writeEnv,
        dockerComposeUp,
        dockerComposeProcesses,
        integrationTests(["DOMAIN=${_DOMAIN}", "NAME=${_NAME}"]),
        dockerComposeLogs,
        dockerPush({ name: imageName }),
        deployServer({
          name: imageName,
          env:
            "DOMAIN=${_DOMAIN},NAME=${_NAME},MONGODB_USER=gcp${_ENV_NAME_SPECIFIER},MONGODB_HOST=${_NODE_ENV}-ggjlv.gcp.mongodb.net,MONGODB_PROTOCOL=mongodb+srv",
          labels: `domain=\${_DOMAIN},name=\${_NAME}`
        }),
        startDnsTransaction,
        addDnsTransaction,
        executeDnsTransaction,
        abortDnsTransaction,
        mapDomain
      ];
    }
    case "event-store":
  }
};
