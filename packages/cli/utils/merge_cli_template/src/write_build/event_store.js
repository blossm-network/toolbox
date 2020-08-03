const yarnInstall = require("./steps/yarn_install");
const unitTests = require("./steps/unit_tests");
const baseUnitTests = require("./steps/base_unit_tests");
const buildImage = require("./steps/build_image");
const dockerComposeUp = require("./steps/docker_compose_up");
const dockerComposeProcesses = require("./steps/docker_compose_processes");
const baseIntegrationTests = require("./steps/base_integration_tests");
const integrationTests = require("./steps/integration_tests");
const dockerComposeLogs = require("./steps/docker_compose_logs");
const dockerPush = require("./steps/docker_push");
const deployRun = require("./steps/deploy_run");
const createKeyRing = require("./steps/create_key_ring");
const createSymmetricEncryptKey = require("./steps/create_symmetric_encrypt_key");
const createAsymmetricSignKey = require("./steps/create_asymmetric_sign_key");
const scheduleJob = require("./steps/schedule_job");
const updateScheduledJob = require("./steps/update_scheduled_job");
const startDnsTransaction = require("./steps/start_dns_transaction");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const createPubsubTopic = require("./steps/create_pubsub_topic");
const mapDomain = require("./steps/map_domain");
const writeEnv = require("./steps/write_env");
const createQueue = require("./steps/create_queue");
const updateQueue = require("./steps/update_queue");

module.exports = ({
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
      procedure,
      operationHash,
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
            env: {
              DOMAIN: domain,
              SERVICE: service,
              MONGODB_DATABASE: `${service}.${domain}`,
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
        ]
      : [dockerComposeLogs]),
  ];
};
