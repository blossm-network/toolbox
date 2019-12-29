const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");
const rootDir = require("@blossm/cli-root-dir");

const viewStore = require("./view_store");
const commandGateway = require("./command_gateway");
const commandHandler = require("./command_handler");
const eventHandler = require("./event_handler");
const eventStore = require("./event_store");
const job = require("./job");

const steps = ({
  config,
  region,
  domain,
  action,
  name,
  project,
  network,
  memory,
  envUriSpecifier,
  envNameSpecifier,
  containerRegistery,
  mainContainerName,
  dnsZone,
  service,
  context,
  env,
  operationHash,
  operationName,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  imageExtension
}) => {
  const serviceName = `${region}-${operationName}-${operationHash}`;
  const uri = `${operationHash}.${region}.${envUriSpecifier}${network}`;
  const blossmConfig = rootDir.config();
  switch (config.context) {
    case "view-store":
      return viewStore({
        imageExtension,
        region,
        domain,
        name,
        project,
        network,
        memory,
        envUriSpecifier,
        envNameSpecifier,
        containerRegistery,
        mainContainerName,
        dnsZone,
        service,
        context,
        operationHash,
        operationName,
        serviceName,
        env,
        uri,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        mongodbUser: blossmConfig.vendors.viewStore.mongodb.user,
        mongodbHost: blossmConfig.vendors.viewStore.mongodb.host,
        mongodbProtocol: blossmConfig.vendors.viewStore.mongodb.protocol
      });
    case "event-store":
      return eventStore({
        imageExtension,
        domain,
        region,
        project,
        envNameSpecifier,
        dnsZone,
        service,
        context,
        network,
        envUriSpecifier,
        memory,
        env,
        serviceName,
        containerRegistery,
        mainContainerName,
        operationHash,
        uri,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        mongodbUser: blossmConfig.vendors.eventStore.mongodb.user,
        mongodbHost: blossmConfig.vendors.eventStore.mongodb.host,
        mongodbProtocol: blossmConfig.vendors.eventStore.mongodb.protocol
      });
    case "event-handler":
      return eventHandler({
        imageExtension,
        action,
        region,
        domain,
        name,
        project,
        network,
        envUriSpecifier,
        envNameSpecifier,
        containerRegistery,
        eventHandler,
        mainContainerName,
        dnsZone,
        service,
        memory,
        context,
        operationHash,
        env,
        serviceName,
        uri,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing
      });
    case "command-handler":
      return commandHandler({
        imageExtension,
        action,
        region,
        domain,
        project,
        network,
        memory,
        mainContainerName,
        envUriSpecifier,
        envNameSpecifier,
        containerRegistery,
        operationHash,
        dnsZone,
        service,
        context,
        env,
        serviceName,
        uri,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing
      });
    case "job":
      return job({
        imageExtension,
        name,
        domain,
        region,
        project,
        envNameSpecifier,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dnsZone,
        service,
        context,
        memory,
        operationHash,
        env,
        serviceName,
        uri,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing
      });
    case "command-gateway":
      return commandGateway({
        imageExtension,
        region,
        project,
        envNameSpecifier,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dnsZone,
        memory,
        env,
        service,
        domain,
        context,
        network,
        operationHash,
        operationName,
        serviceName,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing
      });
  }
};

const imageExtension = ({ domain, name, action, context }) => {
  switch (context) {
    case "view-store":
      return `${domain}.${name}`;
    case "event-store":
    case "command-gateway":
      return domain;
    case "event-handler":
      return `${domain}.did-${action}.${name}`;
    case "command-handler":
      return `${domain}.${action}`;
    case "job":
      return `${domain}.${name}`;
  }
};

module.exports = ({
  config,
  workingDir,
  region,
  domain,
  action,
  name,
  project,
  network,
  context,
  memory,
  envUriSpecifier,
  envNameSpecifier,
  containerRegistery,
  mainContainerName,
  dnsZone,
  service,
  operationHash,
  operationName,
  env,
  uri,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing
}) => {
  const buildPath = path.resolve(workingDir, "build.yaml");

  const i = imageExtension({
    context: config.context,
    action,
    name,
    domain
  });

  const build = {
    steps: steps({
      imageExtension: i,
      config,
      region,
      domain,
      action,
      name,
      project,
      network,
      memory,
      context,
      envUriSpecifier,
      envNameSpecifier,
      containerRegistery,
      mainContainerName,
      dnsZone,
      service,
      env,
      operationHash,
      operationName,
      uri,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing
    })
  };

  fs.writeFileSync(buildPath, yaml.stringify(build));
};
