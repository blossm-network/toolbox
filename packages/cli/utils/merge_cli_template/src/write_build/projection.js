const yarnInstall = require("./steps/yarn_install");
const unitTests = require("./steps/unit_tests");
const baseUnitTests = require("./steps/base_unit_tests");
const buildImage = require("./steps/build_image");
const dockerComposeUp = require("./steps/docker_compose_up");
const dockerComposeProcesses = require("./steps/docker_compose_processes");
const integrationTests = require("./steps/integration_tests");
const baseIntegrationTests = require("./steps/base_integration_tests");
const dockerComposeLogs = require("./steps/docker_compose_logs");
const scheduleJob = require("./steps/schedule_job");
const dockerPush = require("./steps/docker_push");
const deployRun = require("./steps/deploy_run");
const startDnsTransaction = require("./steps/start_dns_transaction");
const addPubSubPolicy = require("./steps/add_pubsub_policy");
const createPubsubSubscription = require("./steps/create_pubsub_subscription");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");
const writeEnv = require("./steps/write_env");
const createQueue = require("./steps/create_queue");
const updateQueue = require("./steps/update_queue");

module.exports = ({
  region,
  context,
  name,
  events,
  project,
  network,
  computeUrlId,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  localBaseNetwork,
  localNetwork,
  timeout,
  memory,
  uri,
  serviceName,
  dnsZone,
  procedure,
  env,
  host,
  baseNetwork,
  envVars,
  devEnvVars,
  operationHash,
  operationName,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
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
      procedure,
      region,
      operationHash,
      localBaseNetwork,
      localNetwork,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      serviceName,
      custom: {
        ...(context && { CONTEXT: context }),
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
            rolesBucket,
            secretBucket,
            baseNetwork,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            nodeEnv: env,
            computeUrlId,
            operationHash,
            host,
            timeout,
            memory,
            region,
            project,
            network,
            envUriSpecifier,
            redisIp,
            env: {
              NAME: name,
              ...(context && { CONTEXT: context }),
              ...envVars,
            },
            labels: {
              name,
              ...(context && { context }),
            },
          }),
          //Only one replay at a time.
          createQueue({
            name: `projection${context ? `-${context}` : ""}-${name}-replay`,
            project,
            maxDispatchPerSecond: 1,
            maxConcurrentDispatches: 1,
          }),
          updateQueue({
            name: `projection${context ? `-${context}` : ""}-${name}-replay`,
            maxDispatchPerSecond: 1,
            maxConcurrentDispatches: 1,
          }),
          createQueue({
            name: `projection${context ? `-${context}` : ""}-${name}-play`,
            project,
            maxDispatchPerSecond: 50,
            maxConcurrentDispatches: 100,
          }),
          updateQueue({
            name: `projection${context ? `-${context}` : ""}-${name}-play`,
            maxDispatchPerSecond: 50,
            maxConcurrentDispatches: 100,
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
          addPubSubPolicy({
            region,
            serviceName,
            project,
          }),
          ...events
            .map((store) =>
              store.actions.map((action) =>
                createPubsubSubscription({
                  name,
                  ...(context && { context }),
                  operationHash,
                  operationName,
                  storeDomain: store.domain,
                  storeService: store.service,
                  storeAction: action,
                  procedure,
                  region,
                  computeUrlId,
                  project,
                })
              )
            )
            .flat(),
          scheduleJob({
            name: `projection${context ? `-${context}` : ""}-${name}-check-in`,
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
