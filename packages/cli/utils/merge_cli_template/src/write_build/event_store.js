import yarnInstall from "./steps/yarn_install.js";
import unitTests from "./steps/unit_tests.js";
import baseUnitTests from "./steps/base_unit_tests.js";
import buildImage from "./steps/build_image.js";
import dockerComposeUp from "./steps/docker_compose_up.js";
import dockerComposeProcesses from "./steps/docker_compose_processes.js";
import baseIntegrationTests from "./steps/base_integration_tests.js";
import integrationTests from "./steps/integration_tests.js";
import dockerComposeLogs from "./steps/docker_compose_logs.js";
import dockerPush from "./steps/docker_push.js";
import deployRun from "./steps/deploy_run.js";
import createKeyRing from "./steps/create_key_ring.js";
import createSymmetricEncryptKey from "./steps/create_symmetric_encrypt_key.js";
import createAsymmetricSignKey from "./steps/create_asymmetric_sign_key.js";
import scheduleJob from "./steps/schedule_job.js";
import updateScheduledJob from "./steps/update_scheduled_job.js";
import startDnsTransaction from "./steps/start_dns_transaction.js";
import addDnsTransaction from "./steps/add_dns_transaction.js";
import executeDnsTransaction from "./steps/execute_dns_transaction.js";
import abortDnsTransaction from "./steps/abort_dns_transaction.js";
import createPubsubTopic from "./steps/create_pubsub_topic.js";
import mapDomain from "./steps/map_domain.js";
import writeEnv from "./steps/write_env.js";
import createQueue from "./steps/create_queue.js";
import updateQueue from "./steps/update_queue.js";

export default ({
  domain,
  region,
  project,
  network,
  actions,
  envUriSpecifier,
  dnsZone,
  service,
  coreNetwork,
  procedure,
  computeUrlId,
  timeout,
  memory,
  env,
  serviceName,
  blockSchedule,
  host,
  containerRegistery,
  mainContainerName,
  uri,
  localCoreNetwork,
  localNetwork,
  operationHash,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
  redisHost,
  redisPort,
  strict,
  checkInPath,
  checkInSchedule,
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
      procedure,
      operationHash,
      localCoreNetwork,
      localNetwork,
      region,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        DOMAIN: domain,
        SERVICE: service,
        ...dependencyKeyEnvironmentVariables,
      },
    }),
    createKeyRing({
      name: `${serviceName}-blockchain`,
      location: "global",
      project,
    }),
    createSymmetricEncryptKey({
      name: "private",
      ring: `${serviceName}-blockchain`,
      location: "global",
      rotation: "90d",
      next: "+p90d",
      project,
    }),
    createAsymmetricSignKey({
      name: "producer",
      ring: `${serviceName}-blockchain`,
      location: "global",
      project,
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
            procedure,
            extension: imageExtension,
            coreNetwork,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            computeUrlId,
            operationHash,
            host,
            region,
            timeout,
            memory,
            project,
            envUriSpecifier,
            network,
            nodeEnv: env,
            redisHost,
            redisPort,
            env: {
              DOMAIN: domain,
              SERVICE: service,
              MONGODB_DATABASE: `${service}_${domain}`,
              MONGODB_USER: mongodbUser,
              MONGODB_HOST: mongodbHost,
              MONGODB_PROTOCOL: mongodbProtocol,
              ...dependencyKeyEnvironmentVariables,
            },
            labels: { domain, service },
          }),
          createQueue({
            name: `event-store-${service}-${domain}`,
            project,
            //Throttles for block creation. TODO increase when scale is necessary.
            maxDispatchPerSecond: 10,
            maxConcurrentDispatches: 100,
          }),
          updateQueue({
            name: `event-store-${service}-${domain}`,
            maxDispatchPerSecond: 10,
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
          ...actions.map((action) =>
            createPubsubTopic({
              action,
              domain,
              service,
              project,
            })
          ),
          scheduleJob({
            name: `event-store-${service}-${domain}-create-block`,
            schedule: blockSchedule,
            region,
            serviceName,
            computeUrlId,
            uri: `${uri}/create-block`,
            project,
          }),
          //Update the schedule if it's changed.
          updateScheduledJob({
            name: `event-store-${service}-${domain}-create-block`,
            schedule: blockSchedule,
            project,
          }),
          scheduleJob({
            name: `event-store-${service}-${domain}-check-in`,
            schedule: checkInSchedule,
            region,
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
