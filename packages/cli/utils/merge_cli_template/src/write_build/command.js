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
const scheduleJob = require("./steps/schedule_job");
const writeEnv = require("./steps/write_env");
const deployRun = require("./steps/deploy_run");
const startDnsTransaction = require("./steps/start_dns_transaction");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");
const createQueue = require("./steps/create_queue");
const updateQueue = require("./steps/update_queue");

module.exports = ({
  name,
  region,
  domain,
  project,
  network,
  mainContainerName,
  envUriSpecifier,
  containerRegistery,
  uri,
  host,
  dnsZone,
  service,
  timeout,
  memory,
  env,
  baseNetwork,
  localBaseNetwork,
  localNetwork,
  operationHash,
  serviceName,
  computeUrlId,
  procedure,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  envVars,
  devEnvVars,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
  redisIp,
  strict,
  checkInPath,
  checkInSchedule,
}) => {
  return [
    yarnInstall,
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
      localBaseNetwork,
      localNetwork,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      serviceName,
      custom: {
        DOMAIN: domain,
        SERVICE: service,
        NAME: name,
        ...dependencyKeyEnvironmentVariables,
        ...envVars,
        ...devEnvVars,
      },
    }),
    dockerComposeUp,
    dockerComposeProcesses,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
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
            procedure,
            extension: imageExtension,
            baseNetwork,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            computeUrlId,
            operationHash,
            region,
            host,
            timeout,
            memory,
            project,
            network,
            envUriSpecifier,
            redisIp,
            nodeEnv: env,
            env: {
              NAME: name,
              DOMAIN: domain,
              SERVICE: service,
              ...dependencyKeyEnvironmentVariables,
              ...envVars,
            },
            labels: { name, domain, service },
          }),
          createQueue({
            name: `command-${service}-${domain}-${name}`,
            project,
            maxDispatchPerSecond: 100,
            maxConcurrentDispatches: 100,
          }),
          updateQueue({
            name: `command-${service}-${domain}-${name}`,
            maxDispatchPerSecond: 100,
            maxConcurrentDispatches: 100,
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            uri,
            project,
            region,
            serviceName,
          }),
          scheduleJob({
            name: `command-${service}-${domain}-${name}-check-in`,
            schedule: checkInSchedule,
            serviceName,
            computeUrlId,
            uri: `${uri}/${checkInPath}`,
            method: "get",
            project,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
