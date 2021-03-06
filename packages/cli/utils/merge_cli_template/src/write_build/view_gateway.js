const yarnInstall = require("./steps/yarn_install");
const buildImage = require("./steps/build_image");
const unitTests = require("./steps/unit_tests");
const baseUnitTests = require("./steps/base_unit_tests");
const dockerComposeUp = require("./steps/docker_compose_up");
const dockerComposeProcesses = require("./steps/docker_compose_processes");
const baseIntegrationTests = require("./steps/base_integration_tests");
const integrationTests = require("./steps/integration_tests");
const dockerComposeLogs = require("./steps/docker_compose_logs");
const scheduleJob = require("./steps/schedule_job");
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
  project,
  network,
  publicKeyUrl,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  serviceName,
  dnsZone,
  context,
  localBaseNetwork,
  localNetwork,
  computeUrlId,
  baseNetwork,
  procedure,
  operationHash,
  timeout,
  host,
  memory,
  env,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  redisIp,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
  strict,
  checkInPath,
  checkInSchedule,
}) => {
  const authUri = `v${
    context ? `.${context}` : ""
  }.${envUriSpecifier}${network}`;
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
      serviceName,
      operationHash,
      secretBucket,
      localBaseNetwork,
      localNetwork,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        ...(context && { CONTEXT: context }),
        ...dependencyKeyEnvironmentVariables,
        ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl }),
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
            extension: imageExtension,
            serviceName,
            allowUnauthenticated: true,
            procedure,
            rolesBucket,
            secretBucket,
            computeUrlId,
            operationHash,
            baseNetwork,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            nodeEnv: env,
            host,
            timeout,
            memory,
            redisIp,
            region,
            project,
            network,
            envUriSpecifier,
            env: {
              ...(context && { CONTEXT: context }),
              ...dependencyKeyEnvironmentVariables,
              ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl }),
            },
            labels: {
              ...(context && { context }),
            },
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri: authUri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            uri: authUri,
            project,
            region,
            serviceName,
          }),
          scheduleJob({
            name: `view-gateway${context ? `-${context}` : ""}-check-in`,
            schedule: checkInSchedule,
            serviceName,
            computeUrlId,
            uri: `${authUri}/${checkInPath}`,
            method: "get",
            project,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
