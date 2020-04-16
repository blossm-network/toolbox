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
const deploy = require("./steps/deploy");
const startDnsTransaction = require("./steps/start_dns_transaction");
const addPubSubPolicy = require("./steps/add_pubsub_policy");
const createPubsubSubscription = require("./steps/create_pubsub_subscription");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");
const writeEnv = require("./steps/write_env");

module.exports = ({
  region,
  domain,
  service,
  context,
  name,
  event,
  project,
  network,
  computeUrlId,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  memory,
  uri,
  serviceName,
  dnsZone,
  procedure,
  env,
  coreNetwork,
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
      region,
      operationHash,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      coreNetwork,
      custom: {
        ...(domain && { DOMAIN: domain }),
        ...(service && { SERVICE: service }),
        CONTEXT: context,
        NAME: name,
        EVENT_ACTION: event.action,
        EVENT_DOMAIN: event.domain,
        EVENT_SERVICE: event.service,
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
          deploy({
            serviceName,
            procedure,
            extension: imageExtension,
            rolesBucket,
            secretBucket,
            coreNetwork,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            nodeEnv: env,
            computeUrlId,
            operationHash,
            memory,
            region,
            project,
            network,
            envUriSpecifier,
            env: {
              NAME: name,
              ...(domain && { DOMAIN: domain }),
              ...(service && { SERVICE: service }),
              CONTEXT: context,
              EVENT_ACTION: event.action,
              EVENT_DOMAIN: event.domain,
              EVENT_SERVICE: event.service,
            },
            labels: {
              name,
              ...(domain && { domain }),
              ...(service && { service }),
              ...(context && { context }),
              "event-action": event.action,
              "event-domain": event.domain,
              "event-service": event.service,
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
          addPubSubPolicy({
            region,
            serviceName,
            project,
          }),
          createPubsubSubscription({
            name,
            domain,
            context,
            operationHash,
            operationName,
            eventAction: event.action,
            eventDomain: event.domain,
            eventService: event.service,
            procedure,
            region,
            computeUrlId,
            project,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
