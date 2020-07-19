const yarnInstall = require("./steps/yarn_install");
const unitTests = require("./steps/unit_tests");
const baseUnitTests = require("./steps/base_unit_tests");
const buildImage = require("./steps/build_image");
const dockerComposeUp = require("./steps/docker_compose_up");
const dockerComposeProcesses = require("./steps/docker_compose_processes");
const integrationTests = require("./steps/integration_tests");
const baseIntegrationTests = require("./steps/base_integration_tests");
const dockerComposeLogs = require("./steps/docker_compose_logs");
const dockerPush = require("./steps/docker_push");
const deployRun = require("./steps/deploy_run");
const startDnsTransaction = require("./steps/start_dns_transaction");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");
const writeEnv = require("./steps/write_env");

module.exports = ({
  region,
  name,
  project,
  network,
  context,
  timeout,
  memory,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  coreNetwork,
  dnsZone,
  procedure,
  computeUrlId,
  operationHash,
  serviceName,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  env,
  uri,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
  strict,
}) => {
  return [
    yarnInstall,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
    buildImage({
      extension: imageExtension,
      containerRegistery,
      procedure,
    }),
    writeEnv({
      mainContainerName,
      project,
      region,
      procedure,
      operationHash,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        NAME: name,
        CONTEXT: context,
        ...dependencyKeyEnvironmentVariables,
      },
    }),
    dockerComposeUp,
    dockerComposeProcesses,
    ...(runBaseIntegrationTests ? [baseIntegrationTests({ strict })] : []),
    ...(runIntegrationTests ? [integrationTests({ strict })] : []),
    ...(strict
      ? [
          dockerPush({
            extension: imageExtension,
            containerRegistery,
            procedure,
          }),
          deployRun({
            serviceName,
            extension: imageExtension,
            region,
            project,
            coreNetwork,
            operationHash,
            computeUrlId,
            procedure,
            network,
            timeout,
            memory,
            containerRegistery,
            envUriSpecifier,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            nodeEnv: env,
            env: {
              NAME: name,
              CONTEXT: context,
              MONGODB_DATABASE: "view-store",
              MONGODB_USER: mongodbUser,
              MONGODB_HOST: mongodbHost,
              MONGODB_PROTOCOL: mongodbProtocol,
              ...dependencyKeyEnvironmentVariables,
            },
            labels: {
              name,
              context,
            },
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            serviceName,
            uri,
            project,
            region,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
