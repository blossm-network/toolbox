const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");
const rootDir = require("@blossm/cli-root-dir");

const viewStore = require("./view_store");
const authGateway = require("./auth_gateway");
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
  dnsZone,
  service,
  context,
  env,
  operationHash,
  operationName,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing
}) => {
  const serviceName = `${region}-${operationName}-${operationHash}`;
  const uri = `${operationHash}.${region}.${envUriSpecifier}${network}`;
  const blossmConfig = rootDir.config();
  switch (config.context) {
    case "view-store":
      return viewStore({
        region,
        domain,
        name,
        project,
        network,
        memory,
        envUriSpecifier,
        envNameSpecifier,
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
        domain,
        region,
        project,
        envNameSpecifier,
        dnsZone,
        service,
        context,
        env,
        serviceName,
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
        action,
        region,
        domain,
        name,
        project,
        network,
        envUriSpecifier,
        envNameSpecifier,
        dnsZone,
        service,
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
        action,
        region,
        domain,
        project,
        network,
        envUriSpecifier,
        envNameSpecifier,
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
        name,
        domain,
        region,
        project,
        envNameSpecifier,
        dnsZone,
        service,
        context,
        operationHash,
        env,
        serviceName,
        uri,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing
      });
    case "auth-gateway":
      return authGateway({
        region,
        project,
        envNameSpecifier,
        envUriSpecifier,
        dnsZone,
        env,
        service,
        context,
        network,
        operationHash,
        operationName,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing
      });
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

  const build = {
    steps: steps({
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
