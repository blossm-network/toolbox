const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");
const rootDir = require("@blossm/cli-root-dir");

const viewStore = require("./view_store");
const commandGateway = require("./command_gateway");
const viewGateway = require("./view_gateway");
const getJobGateway = require("./get_job_gateway");
const commandAntenna = require("./command_antenna");
const commandHandler = require("./command_handler");
const eventHandler = require("./event_handler");
const eventStore = require("./event_store");
const job = require("./job");

const steps = ({
  region,
  domain,
  name,
  event,
  project,
  network,
  mongodbUser,
  mongodbHost,
  memory,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  dnsZone,
  service,
  procedure,
  env,
  operationHash,
  operationName,
  twilioTestReceivingPhoneNumber,
  twilioSendingPhoneNumber,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  computeUrlId,
  actions,
  strict,
  routerNetwork,
  routerKeyId,
  routerKeySecretName
}) => {
  const serviceName = `${region}-${operationName}-${operationHash}`;
  const uri = `${operationHash}.${region}.${envUriSpecifier}${network}`;
  const blossmConfig = rootDir.config();
  switch (procedure) {
    case "view-store":
      return viewStore({
        imageExtension,
        region,
        domain,
        name,
        event,
        project,
        network,
        memory,
        computeUrlId,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dnsZone,
        service,
        procedure,
        operationHash,
        operationName,
        serviceName,
        env,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        mongodbUser,
        mongodbHost,
        mongodbProtocol: blossmConfig.vendors.viewStore.mongodb.protocol,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict
      });
    case "event-store":
      return eventStore({
        imageExtension,
        domain,
        region,
        project,
        dnsZone,
        service,
        procedure,
        network,
        computeUrlId,
        envUriSpecifier,
        memory,
        env,
        serviceName,
        containerRegistery,
        mainContainerName,
        operationHash,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        mongodbUser,
        mongodbHost,
        mongodbProtocol: blossmConfig.vendors.eventStore.mongodb.protocol,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        actions,
        strict
      });
    case "event-handler":
    case "projection":
      return eventHandler({
        imageExtension,
        region,
        domain,
        name,
        event,
        project,
        network,
        envUriSpecifier,
        computeUrlId,
        containerRegistery,
        mainContainerName,
        dnsZone,
        service,
        memory,
        procedure,
        operationName,
        operationHash,
        env,
        serviceName,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict
      });
    case "command-handler":
      return commandHandler({
        imageExtension,
        name,
        region,
        domain,
        project,
        network,
        memory,
        computeUrlId,
        mainContainerName,
        envUriSpecifier,
        containerRegistery,
        operationHash,
        dnsZone,
        service,
        procedure,
        env,
        serviceName,
        uri,
        twilioTestReceivingPhoneNumber,
        twilioSendingPhoneNumber,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        routerNetwork,
        routerKeyId,
        routerKeySecretName,
        strict
      });
    case "post-job":
    case "get-job":
      return job({
        imageExtension,
        name,
        domain,
        region,
        project,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dnsZone,
        service,
        procedure,
        memory,
        computeUrlId,
        operationHash,
        env,
        serviceName,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        routerNetwork,
        routerKeyId,
        routerKeySecretName,
        strict
      });
    case "command-gateway":
      return commandGateway({
        imageExtension,
        region,
        project,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dnsZone,
        memory,
        env,
        computeUrlId,
        service,
        domain,
        procedure,
        network,
        operationHash,
        operationName,
        serviceName,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        twilioTestReceivingPhoneNumber,
        twilioSendingPhoneNumber,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        routerNetwork,
        routerKeyId,
        routerKeySecretName,
        strict
      });
    case "view-gateway":
      return viewGateway({
        imageExtension,
        region,
        project,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        computeUrlId,
        dnsZone,
        memory,
        env,
        service,
        domain,
        procedure,
        network,
        operationHash,
        operationName,
        serviceName,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        routerNetwork,
        routerKeyId,
        routerKeySecretName,
        strict
      });
    case "get-job-gateway":
      return getJobGateway({
        imageExtension,
        region,
        project,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        computeUrlId,
        dnsZone,
        memory,
        env,
        service,
        domain,
        procedure,
        network,
        operationHash,
        operationName,
        serviceName,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        routerNetwork,
        routerKeyId,
        routerKeySecretName,
        strict
      });
    case "command-antenna":
      return commandAntenna({
        imageExtension,
        region,
        project,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dnsZone,
        memory,
        env,
        computeUrlId,
        service,
        domain,
        procedure,
        network,
        operationHash,
        operationName,
        serviceName,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict
      });
  }
};

const imageExtension = ({ service, domain, name, event, procedure }) => {
  switch (procedure) {
    case "view-store":
      return `${service}.${domain}.${name}`;
    case "event-store":
    case "command-gateway":
    case "view-gateway":
      return `${service}.${domain}`;
    case "get-job-gateway":
      if (service) {
        if (domain) return `${service}.${domain}`;
        return service;
      }
      return "";
    case "event-handler":
    case "projection":
      return `${service}.${domain}.${name}.did-${event.action}.${event.domain}`;
    case "command-handler":
    case "post-job":
    case "get-job":
      return `${service}.${domain}.${name}`;
    default:
      return "";
  }
};

module.exports = ({
  workingDir,
  region,
  domain,
  event,
  name,
  project,
  network,
  procedure,
  memory,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  mongodbUser,
  mongodbHost,
  dnsZone,
  service,
  operationHash,
  operationName,
  twilioTestReceivingPhoneNumber,
  twilioSendingPhoneNumber,
  env,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  computeUrlId,
  actions,
  routerNetwork,
  routerKeyId,
  routerKeySecretName,
  strict
}) => {
  const buildPath = path.resolve(workingDir, "build.yaml");

  const i = imageExtension({
    procedure,
    name,
    domain,
    service,
    event
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
      name,
      event,
      project,
      network,
      memory,
      procedure,
      twilioTestReceivingPhoneNumber,
      twilioSendingPhoneNumber,
      envUriSpecifier,
      containerRegistery,
      mainContainerName,
      dnsZone,
      service,
      env,
      computeUrlId,
      operationHash,
      operationName,
      mongodbHost,
      mongodbUser,
      rolesBucket,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      runUnitTests,
      runBaseUnitTests,
      runIntegrationTests,
      runBaseIntegrationTests,
      routerNetwork,
      routerKeyId,
      routerKeySecretName,
      actions,
      strict
    })
  };

  fs.writeFileSync(buildPath, yaml.stringify(build));
};
