const { stripIndents, oneLine } = require("common-tags");

const rootDir = require("@blossm/cli-root-dir");

const nodeImage = "node:10.16.0";
const dockerComposeImage = "docker/compose:1.15.0";
const dockerImage = "gcr.io/cloud-builders/docker";
const gcloudImage = "gcr.io/cloud-builders/gcloud";

const standardInternalUri =
  "${_OPERATION_HASH}.${_GCP_REGION}.${_ENV_URI_SPECIFIER}${_NETWORK}";

const standardServiceName =
  "${_GCP_REGION}-${_OPERATION_NAME}-${_OPERATION_HASH}";

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
const buildImage = ({ extension } = {}) => {
  return {
    name: dockerImage,
    args: [
      "build",
      "-t",
      `us.gcr.io/\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}/\${_SERVICE}.\${_CONTEXT}${
        extension ? `.${extension}` : ""
      }`,
      "."
    ]
  };
};
const writeEnv = ({ custom = "" } = {}) => {
  return {
    name: nodeImage,
    entrypoint: "bash",
    args: [
      "-c",
      stripIndents`
    cat >> .env <<- EOM
    NETWORK=local
    SERVICE=\${_SERVICE}
    CONTEXT=\${_CONTEXT}
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
    MONGODB_DATABASE=testing
    ${custom}
    EOM`
    ]
  };
};

const dockerComposeUp = {
  name: dockerComposeImage,
  args: ["up", "-d"]
};
const dockerComposeProcesses = {
  name: dockerComposeImage,
  args: ["ps"]
};

const integrationTests = ({ strict = true } = {}) => {
  return {
    name: nodeImage,
    entrypoint: strict ? "yarn" : "bash",
    args: strict
      ? ["test:integration"]
      : ["-c", "yarn test:integration || exit 0"]
  };
};

const dockerComposeLogs = {
  name: dockerComposeImage,
  args: ["logs"]
};

const dockerPush = ({ extension } = {}) => {
  return {
    name: dockerImage,
    args: [
      "push",
      `us.gcr.io/\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}/\${_SERVICE}.\${_CONTEXT}${
        extension ? `.${extension}` : ""
      }`
    ]
  };
};

const deployService = ({
  service = "${_GCP_REGION}-${_OPERATION_NAME}-${_OPERATION_HASH}",
  extension,
  env = "",
  labels = "",
  allowUnauthenticated = false
} = {}) => {
  return {
    name: gcloudImage,
    args: [
      "beta",
      "run",
      "deploy",
      service,
      `--image=us.gcr.io/\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}/\${_SERVICE}.\${_CONTEXT}${
        extension ? `.${extension}` : ""
      }`,
      "--platform=managed",
      "--memory=${_MEMORY}",
      ...(allowUnauthenticated ? ["--allow-unauthenticated"] : []),
      "--project=${_GCP_PROJECT}${_ENV_NAME_SPECIFIER}",
      "--region=${_GCP_REGION}",
      `--set-env-vars=NODE_ENV=\${_NODE_ENV},NETWORK=\${_GCP_REGION}.\${_ENV_URI_SPECIFIER}\${_NETWORK},SERVICE=\${_SERVICE},CONTEXT=\${_CONTEXT},GCP_PROJECT=\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER},GCP_REGION=\${_GCP_REGION},GCP_SECRET_BUCKET=smn\${_ENV_NAME_SPECIFIER}-secrets,${env}`,
      `--labels=service=\${_SERVICE},context=\${_CONTEXT},${labels}`
    ]
  };
};

const startDnsTransaction = {
  name: gcloudImage,
  args: [
    "beta",
    "dns",
    "record-sets",
    "transaction",
    "start",
    "--zone=${_GCP_DNS_ZONE}",
    "--project=${_GCP_PROJECT}"
  ]
};

const addPubSubPolicy = {
  name: gcloudImage,
  args: [
    "beta",
    "run",
    "services",
    "add-iam-policy-binding",
    "${_GCP_REGION}-${_OPERATION_NAME}-${_OPERATION_HASH}",
    "--member=serviceAccount:cloud-run-pubsub-invoker@${_GCP_PROJECT}${_ENV_NAME_SPECIFIER}.iam.gserviceaccount.com",
    "--role=roles/run.invoker",
    "--project=${_GCP_PROJECT}${_ENV_NAME_SPECIFIER}",
    "--region=${_GCP_REGION}"
  ]
};

const createPubsubTopic = {
  name: gcloudImage,
  entrypoint: "bash",
  args: [
    "-c",
    oneLine`
    gcloud pubsub topics create did-\${_ACTION}.\${_DOMAIN}.\${_SERVICE}.\${_ENV_URI_SPECIFIER}\${_NETWORK} 
    --project=\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER} || exit 0
    `
  ]
};

const createPubsubSubscription = {
  name: gcloudImage,
  entrypoint: "bash",
  args: [
    "-c",
    oneLine`
    gcloud beta pubsub subscriptions create \${_SERVICE}-\${_CONTEXT}-\${_OPERATION_HASH}
    --topic=did-\${_ACTION}.\${_DOMAIN}.\${_SERVICE}.\${_ENV_URI_SPECIFIER}\${_NETWORK}
    --push-endpoint=https://\${_OPERATION_HASH}.\${_GCP_REGION}.\${_ENV_URI_SPECIFIER}\${_NETWORK}
    --push-auth-service-account=cloud-run-pubsub-invoker@\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}.iam.gserviceaccount.com
    --project=\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}
    --labels=service=\${_SERVICE},context=\${_CONTEXT},domain=\${_DOMAIN},action=\${_ACTION},name=\${_NAME},hash=\${_OPERATION_HASH} || exit 0
    `
  ]
};

const addDnsTransaction = ({ uri }) => {
  return {
    name: gcloudImage,
    args: [
      "beta",
      "dns",
      "record-sets",
      "transaction",
      "add",
      "ghs.googlehosted.com.",
      `--name=${uri}`,
      "--zone=${_GCP_DNS_ZONE}",
      "--type=CNAME",
      "--ttl=86400",
      "--project=${_GCP_PROJECT}"
    ]
  };
};

const executeDnsTransaction = {
  name: gcloudImage,
  entrypoint: "bash",
  args: [
    "-c",
    oneLine`
    gcloud beta dns record-sets transaction execute
    --zone=\${_GCP_DNS_ZONE}
    --project=\${_GCP_PROJECT} || exit 0
    `
  ]
};

const abortDnsTransaction = {
  name: gcloudImage,
  entrypoint: "bash",
  args: [
    "-c",
    oneLine`
    gcloud beta dns record-sets transaction abort
    --zone=\${_GCP_DNS_ZONE}
    --project=\${_GCP_PROJECT} || exit 0
    `
  ]
};

const mapDomain = ({ service, uri }) => {
  return {
    name: gcloudImage,
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
      gcloud beta run domain-mappings create
      --platform=managed
      --service=${service}
      --domain=${uri}
      --project=\${_GCP_PROJECT}\${_ENV_NAME_SPECIFIER}
      --region=\${_GCP_REGION} || exit 0
      `
    ]
  };
};

module.exports = ({ config }) => {
  const blossmConfig = rootDir.config();
  switch (config.context) {
    case "view-store": {
      const imageExtension = "${_DOMAIN}.${_NAME}";
      return [
        yarnInstall,
        unitTest,
        buildImage({ extension: imageExtension }),
        writeEnv({
          custom: stripIndents`
            OPERATION_HASH=\${_OPERATION_HASH}
            DOMAIN=\${_DOMAIN}
            NAME=\${_NAME}`
        }),
        dockerComposeUp,
        dockerComposeProcesses,
        integrationTests(),
        dockerComposeLogs,
        dockerPush({ extension: imageExtension }),
        deployService({
          extension: imageExtension,
          service: standardServiceName,
          env: `DOMAIN=\${_DOMAIN},NAME=\${_NAME},MONGODB_DATABASE=view-store,MONGODB_USER=${blossmConfig.vendors.viewStore.mongodb.user}\${_ENV_NAME_SPECIFIER},MONGODB_HOST=\${_NODE_ENV}-${blossmConfig.vendors.viewStore.mongodb.host},MONGODB_PROTOCOL=${blossmConfig.vendors.viewStore.mongodb.protocol}`,
          labels: "domain=${_DOMAIN},name=${_NAME},hash=${_OPERATION_HASH}"
        }),
        startDnsTransaction,
        addDnsTransaction({ uri: standardInternalUri }),
        executeDnsTransaction,
        abortDnsTransaction,
        mapDomain({
          service: standardServiceName,
          uri: standardInternalUri
        })
      ];
    }
    case "event-store": {
      const imageExtension = "${_DOMAIN}";
      return [
        yarnInstall,
        unitTest,
        buildImage({ extension: imageExtension }),
        writeEnv({
          custom: stripIndents`
            OPERATION_HASH=\${_OPERATION_HASH}
            DOMAIN=\${_DOMAIN}`
        }),
        dockerComposeUp,
        dockerComposeProcesses,
        integrationTests(),
        dockerComposeLogs,
        dockerPush({ extension: imageExtension }),
        deployService({
          service: standardServiceName,
          extension: imageExtension,
          env: `DOMAIN=\${_DOMAIN},MONGODB_DATABASE=event-store,MONGODB_USER=${blossmConfig.vendors.eventStore.mongodb.user}\${_ENV_NAME_SPECIFIER},MONGODB_HOST=\${_NODE_ENV}-${blossmConfig.vendors.eventStore.mongodb.host},MONGODB_PROTOCOL=${blossmConfig.vendors.eventStore.mongodb.protocol}`,
          labels: "domain=${_DOMAIN},hash=${_OPERATION_HASH}"
        }),
        startDnsTransaction,
        addDnsTransaction({ uri: standardInternalUri }),
        executeDnsTransaction,
        abortDnsTransaction,
        mapDomain({
          service: standardServiceName,
          uri: standardInternalUri
        })
      ];
    }
    case "event-handler": {
      const imageExtension = "${_DOMAIN}.did-${_ACTION}.${_NAME}";
      return [
        yarnInstall,
        unitTest,
        buildImage({ extension: imageExtension }),
        writeEnv({
          custom: stripIndents`
            OPERATION_HASH=\${_OPERATION_HASH}
            DOMAIN=\${_DOMAIN}
            ACTION=\${_ACTION}
            NAME=\${_NAME}`
        }),
        dockerComposeUp,
        dockerComposeProcesses,
        integrationTests(),
        dockerComposeLogs,
        dockerPush({ extension: imageExtension }),
        deployService({
          service: standardServiceName,
          extension: imageExtension,
          env: "DOMAIN=${_DOMAIN},ACTION=${_ACTION},NAME=${_NAME}",
          labels:
            "domain=${_DOMAIN},action=${_ACTION},name=${_NAME},hash=${_OPERATION_HASH}"
        }),
        startDnsTransaction,
        addDnsTransaction({ uri: standardInternalUri }),
        executeDnsTransaction,
        abortDnsTransaction,
        mapDomain({
          service: standardServiceName,
          uri: standardInternalUri
        }),
        addPubSubPolicy,
        createPubsubTopic,
        createPubsubSubscription
      ];
    }
    case "command-handler": {
      const imageExtension = "${_DOMAIN}.${_ACTION}";
      return [
        yarnInstall,
        unitTest,
        buildImage({ extension: imageExtension }),
        writeEnv({
          custom: stripIndents`
            OPERATION_HASH=\${_OPERATION_HASH}
            DOMAIN=\${_DOMAIN}
            ACTION=\${_ACTION}`
        }),
        dockerComposeUp,
        dockerComposeProcesses,
        integrationTests(),
        dockerComposeLogs,
        dockerPush({ extension: imageExtension }),
        deployService({
          service: standardServiceName,
          extension: imageExtension,
          env: "DOMAIN=${_DOMAIN},ACTION=${_ACTION}",
          labels: "domain=${_DOMAIN},action=${_ACTION},hash=${_OPERATION_HASH}"
        }),
        startDnsTransaction,
        addDnsTransaction({ uri: standardInternalUri }),
        executeDnsTransaction,
        abortDnsTransaction,
        mapDomain({
          service: standardServiceName,
          uri: standardInternalUri
        }),
        createPubsubTopic
      ];
    }
    case "job": {
      const imageExtension = "${_DOMAIN}.${_NAME}";
      return [
        yarnInstall,
        unitTest,
        buildImage({ extension: imageExtension }),
        writeEnv({
          custom: stripIndents`
            OPERATION_HASH=\${_OPERATION_HASH}
            DOMAIN=\${_DOMAIN}
            NAME=\${_NAME}`
        }),
        dockerComposeUp,
        dockerComposeProcesses,
        integrationTests(),
        dockerComposeLogs,
        dockerPush({ extension: imageExtension }),
        deployService({
          service: standardServiceName,
          extension: imageExtension,
          env: "DOMAIN=${_DOMAIN},NAME=${_NAME}",
          labels: "domain=${_DOMAIN},name=${_NAME},hash=${_OPERATION_HASH}"
        }),
        startDnsTransaction,
        addDnsTransaction({ uri: standardInternalUri }),
        executeDnsTransaction,
        abortDnsTransaction,
        mapDomain({
          service: standardServiceName,
          uri: standardInternalUri
        })
      ];
    }
    case "auth-gateway": {
      const authService = "${_GCP_REGION}-${_SERVICE}-${_CONTEXT}";
      const authUri = "auth.${_ENV_URI_SPECIFIER}${_NETWORK}";
      return [
        yarnInstall,
        unitTest,
        buildImage(),
        writeEnv(),
        dockerComposeUp,
        dockerComposeProcesses,
        integrationTests({ strict: false }),
        dockerComposeLogs,
        dockerPush(),
        deployService({
          service: authService,
          allowUnauthenticated: true
        }),
        startDnsTransaction,
        addDnsTransaction({ uri: authUri }),
        executeDnsTransaction,
        abortDnsTransaction,
        mapDomain({
          service: authService,
          uri: authUri
        })
      ];
    }
  }
};
