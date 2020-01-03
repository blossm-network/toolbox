const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");
const rootDir = require("@blossm/cli-root-dir");

const viewStore = require("./view_store");
const commandGateway = require("./command_gateway");
const viewGateway = require("./view_gateway");
const commandHandler = require("./command_handler");
const eventHandler = require("./event_handler");
const eventStore = require("./event_store");
const job = require("./job");

const steps = ({
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
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests
}) => {
  const serviceName = `${region}-${operationName}-${operationHash}`;
  const uri = `${operationHash}.${region}.${envUriSpecifier}${network}`;
  const blossmConfig = rootDir.config();
  switch (context) {
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
        mongodbProtocol: blossmConfig.vendors.viewStore.mongodb.protocol,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests
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
        mongodbProtocol: blossmConfig.vendors.eventStore.mongodb.protocol,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests
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
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests
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
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests
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
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests
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
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests
      });
    case "view-gateway":
      return viewGateway({
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
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests
      });
  }
};

const imageExtension = ({ domain, name, action, context }) => {
  switch (context) {
    case "view-store":
      return `${domain}.${name}`;
    case "event-store":
    case "command-gateway":
    case "view-gateway":
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
    context,
    action,
    name,
    domain
  });

  const runUnitTests = fs.existsSync(path.resolve(workingDir, "test/unit"));
  const runBaseUnitTests = fs.existsSync(
    path.resolve(workingDir, "base_test/unit")
  );
  const runIntegrationTests = fs.existsSync(
    path.resolve(workingDir, "test/integration")
  );
  const runBaseIntegrationTests = fs.existsSync(
    path.resolve(workingDir, "base_test/integration")
  );

  const build = {
    steps: steps({
      imageExtension: i,
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
      secretBucketKeyRing,
      runUnitTests,
      runBaseUnitTests,
      runIntegrationTests,
      runBaseIntegrationTests
    })
  };

  fs.writeFileSync(buildPath, yaml.stringify(build));
};
