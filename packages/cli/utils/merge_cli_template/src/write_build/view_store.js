import yarnInstall from "./steps/yarn_install.js";
import unitTests from "./steps/unit_tests.js";
import baseUnitTests from "./steps/base_unit_tests.js";
import buildImage from "./steps/build_image.js";
import dockerComposeUp from "./steps/docker_compose_up.js";
import dockerComposeProcesses from "./steps/docker_compose_processes.js";
import integrationTests from "./steps/integration_tests.js";
import baseIntegrationTests from "./steps/base_integration_tests.js";
import scheduleJob from "./steps/schedule_job.js";
import dockerComposeLogs from "./steps/docker_compose_logs.js";
import dockerPush from "./steps/docker_push.js";
import deployRun from "./steps/deploy_run.js";
import startDnsTransaction from "./steps/start_dns_transaction.js";
import addDnsTransaction from "./steps/add_dns_transaction.js";
import executeDnsTransaction from "./steps/execute_dns_transaction.js";
import abortDnsTransaction from "./steps/abort_dns_transaction.js";
import mapDomain from "./steps/map_domain.js";
import writeEnv from "./steps/write_env.js";
import createQueue from "./steps/create_queue.js";
import updateQueue from "./steps/update_queue.js";

export default ({
  region,
  name,
  project,
  network,
  context,
  bootstrapContext,
  timeout,
  memory,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  baseNetwork,
  localBaseNetwork,
  localNetwork,
  dnsZone,
  procedure,
  computeUrlId,
  operationHash,
  serviceName,
  redisHost,
  redisPort,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  env,
  uri,
  host,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
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
      localBaseNetwork,
      localNetwork,
      operationHash,
      secretBucket,
      serviceName,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        NAME: name,
        ...(context && { CONTEXT: context }),
        ...(bootstrapContext && { BOOTSTRAP_CONTEXT: bootstrapContext }),
        ...dependencyKeyEnvironmentVariables,
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
            extension: imageExtension,
            region,
            project,
            baseNetwork,
            operationHash,
            computeUrlId,
            procedure,
            network,
            host,
            timeout,
            memory,
            containerRegistery,
            envUriSpecifier,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            nodeEnv: env,
            redisHost,
            redisPort,
            env: {
              NAME: name,
              ...(context && { CONTEXT: context }),
              ...(bootstrapContext && { BOOTSTRAP_CONTEXT: bootstrapContext }),
              MONGODB_DATABASE: `${context ? `${context}_` : ""}${name}`,
              MONGODB_USER: mongodbUser,
              MONGODB_HOST: mongodbHost,
              MONGODB_PROTOCOL: mongodbProtocol,
              ...dependencyKeyEnvironmentVariables,
            },
            labels: {
              name,
              ...(context && { context }),
            },
          }),
          createQueue({
            name: `view-store${context ? `-${context}` : ""}-${name}`,
            project,
            maxDispatchPerSecond: 50,
            maxConcurrentDispatches: 100,
          }),
          updateQueue({
            name: `view-store${context ? `-${context}` : ""}-${name}`,
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
          scheduleJob({
            name: `view-store-${context ? `-${context}` : ""}-${name}-check-in`,
            schedule: checkInSchedule,
            serviceName,
            region,
            computeUrlId,
            uri: `${uri}/${checkInPath}`,
            method: "get",
            project,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
