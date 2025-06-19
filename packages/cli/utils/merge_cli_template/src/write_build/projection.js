import yarnInstall from "./steps/yarn_install.js";
import unitTests from "./steps/unit_tests.js";
import baseUnitTests from "./steps/base_unit_tests.js";
import buildImage from "./steps/build_image.js";
import dockerComposeUp from "./steps/docker_compose_up.js";
import dockerComposeProcesses from "./steps/docker_compose_processes.js";
import integrationTests from "./steps/integration_tests.js";
import baseIntegrationTests from "./steps/base_integration_tests.js";
import dockerComposeLogs from "./steps/docker_compose_logs.js";
import scheduleJob from "./steps/schedule_job.js";
import dockerPush from "./steps/docker_push.js";
import deployRun from "./steps/deploy_run.js";
import startDnsTransaction from "./steps/start_dns_transaction.js";
import addPubSubPolicy from "./steps/add_pubsub_policy.js";
import createPubsubSubscription from "./steps/create_pubsub_subscription.js";
import addDnsTransaction from "./steps/add_dns_transaction.js";
import executeDnsTransaction from "./steps/execute_dns_transaction.js";
import abortDnsTransaction from "./steps/abort_dns_transaction.js";
import mapDomain from "./steps/map_domain.js";
import writeEnv from "./steps/write_env.js";
import createQueue from "./steps/create_queue.js";
import updateQueue from "./steps/update_queue.js";

export default ({
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
              ...dependencyKeyEnvironmentVariables,
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
