const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");

const viewStore = require("./view_store");
const commandGateway = require("./command_gateway");
const viewGateway = require("./view_gateway");
const factGateway = require("./fact_gateway");
const command = require("./command");
const eventHandler = require("./event_handler");
const eventStore = require("./event_store");
const job = require("./job");
const viewComposite = require("./view_composite");

const steps = ({
  region,
  domain,
  name,
  store,
  publicKeyUrl,
  project,
  network,
  timeout,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  memory,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  coreNetwork,
  dnsZone,
  service,
  procedure,
  env,
  context,
  operationHash,
  operationName,
  envVars,
  devEnvVars,
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
  strict,
  dependencyKeyEnvironmentVariables,
}) => {
  const serviceName = `${region}-${operationName}-${operationHash}`;
  const uri = `${operationHash}.${region}.${envUriSpecifier}${network}`;
  switch (procedure) {
    case "view-store":
      return viewStore({
        imageExtension,
        region,
        domain,
        service,
        name,
        project,
        network,
        context,
        memory,
        computeUrlId,
        envUriSpecifier,
        dependencyKeyEnvironmentVariables,
        containerRegistery,
        mainContainerName,
        dnsZone,
        timeout,
        procedure,
        operationHash,
        operationName,
        serviceName,
        coreNetwork,
        env,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        mongodbUser,
        mongodbHost,
        mongodbProtocol,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict,
      });
    case "view-composite":
      return viewComposite({
        imageExtension,
        region,
        domain,
        service,
        name,
        project,
        network,
        context,
        memory,
        computeUrlId,
        envUriSpecifier,
        dependencyKeyEnvironmentVariables,
        containerRegistery,
        mainContainerName,
        dnsZone,
        procedure,
        operationHash,
        operationName,
        serviceName,
        coreNetwork,
        timeout,
        env,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict,
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
        coreNetwork,
        memory,
        env,
        serviceName,
        dependencyKeyEnvironmentVariables,
        containerRegistery,
        mainContainerName,
        operationHash,
        timeout,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        mongodbUser,
        mongodbHost,
        mongodbProtocol,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict,
      });
    case "event-handler":
    case "projection":
      return eventHandler({
        imageExtension,
        region,
        domain,
        service,
        name,
        store,
        project,
        network,
        mongodbUser,
        mongodbHost,
        mongodbProtocol,
        dependencyKeyEnvironmentVariables,
        envUriSpecifier,
        computeUrlId,
        containerRegistery,
        mainContainerName,
        coreNetwork,
        timeout,
        dnsZone,
        context,
        memory,
        procedure,
        operationName,
        operationHash,
        env,
        serviceName,
        envVars,
        devEnvVars,
        uri,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict,
      });
    case "command":
      return command({
        imageExtension,
        name,
        region,
        domain,
        project,
        network,
        memory,
        computeUrlId,
        coreNetwork,
        dependencyKeyEnvironmentVariables,
        mainContainerName,
        envUriSpecifier,
        containerRegistery,
        operationHash,
        dnsZone,
        service,
        procedure,
        timeout,
        env,
        serviceName,
        uri,
        envVars,
        devEnvVars,
        rolesBucket,
        secretBucket,
        secretBucketKeyLocation,
        secretBucketKeyRing,
        runUnitTests,
        runBaseUnitTests,
        runIntegrationTests,
        runBaseIntegrationTests,
        strict,
      });
    case "job":
    case "fact":
      return job({
        imageExtension,
        name,
        domain,
        region,
        project,
        network,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dependencyKeyEnvironmentVariables,
        coreNetwork,
        dnsZone,
        service,
        procedure,
        timeout,
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
        envVars,
        devEnvVars,
        strict,
      });
    case "command-gateway":
      return commandGateway({
        imageExtension,
        publicKeyUrl,
        region,
        project,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dependencyKeyEnvironmentVariables,
        dnsZone,
        memory,
        coreNetwork,
        env,
        envVars,
        timeout,
        devEnvVars,
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
        strict,
      });
    case "view-gateway":
      return viewGateway({
        imageExtension,
        publicKeyUrl,
        region,
        project,
        context,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        dependencyKeyEnvironmentVariables,
        computeUrlId,
        dnsZone,
        coreNetwork,
        memory,
        timeout,
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
        strict,
      });
    case "fact-gateway":
      return factGateway({
        imageExtension,
        publicKeyUrl,
        region,
        project,
        envUriSpecifier,
        containerRegistery,
        mainContainerName,
        coreNetwork,
        computeUrlId,
        dependencyKeyEnvironmentVariables,
        dnsZone,
        timeout,
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
        strict,
      });
  }
};

const imageExtension = ({
  service,
  context,
  domain,
  name,
  store,
  procedure,
}) => {
  switch (procedure) {
    case "view-store":
    case "view-composite":
      return `${context}${service ? `.${service}` : ""}${
        domain ? `.${domain}` : ""
      }.${name}`;
    case "event-store":
    case "command-gateway":
      return `${service}.${domain}`;
    case "view-gateway":
      return `${context}${service ? `.${service}` : ""}${
        domain ? `.${domain}` : ""
      }`;
    case "fact-gateway":
      if (service) {
        if (domain) return `${service}.${domain}`;
        return service;
      }
      return "";
    case "event-handler":
    case "projection":
      return `${context}${domain ? `.${domain}` : ""}${
        service ? `.${service}` : ""
      }.${name}.${store.domain}.${store.service}`;
    case "command":
      return `${service}.${domain}.${name}`;
    case "job":
    case "fact":
      return `${service ? `${service}.` : ""}${
        domain ? `${domain}.` : ""
      }${name}`;
    default:
      return "";
  }
};

module.exports = ({
  workingDir,
  region,
  domain,
  store,
  publicKeyUrl,
  name,
  project,
  network,
  procedure,
  memory,
  context,
  envUriSpecifier,
  coreNetwork,
  containerRegistery,
  mainContainerName,
  dependencyKeyEnvironmentVariables,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  dnsZone,
  service,
  operationHash,
  operationName,
  envVars,
  devEnvVars,
  timeout,
  env,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  computeUrlId,
  strict,
}) => {
  const buildPath = path.resolve(workingDir, "build.yaml");

  const i = imageExtension({
    procedure,
    name,
    domain,
    service,
    context,
    store,
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
      publicKeyUrl,
      store,
      project,
      network,
      context,
      memory,
      procedure,
      envVars,
      devEnvVars,
      envUriSpecifier,
      dependencyKeyEnvironmentVariables,
      containerRegistery,
      mainContainerName,
      dnsZone,
      service,
      timeout,
      env,
      coreNetwork,
      computeUrlId,
      operationHash,
      operationName,
      mongodbHost,
      mongodbUser,
      mongodbProtocol,
      rolesBucket,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      runUnitTests,
      runBaseUnitTests,
      runIntegrationTests,
      runBaseIntegrationTests,
      strict,
    }),
  };

  fs.writeFileSync(buildPath, yaml.stringify(build));
};
