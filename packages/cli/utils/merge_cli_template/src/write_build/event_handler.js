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
const createPubsubTopic = require("./steps/create_pubsub_topic");
const createPubsubSubscription = require("./steps/create_pubsub_subscription");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");
const writeEnv = require("./steps/write_env");

module.exports = ({
  region,
  domain,
  name,
  event,
  project,
  network,
  envUriSpecifier,
  envNameSpecifier,
  containerRegistery,
  mainContainerName,
  memory,
  uri,
  serviceName,
  dnsZone,
  service,
  context,
  env,
  operationHash,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests
}) => {
  return [
    yarnInstall,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
    buildImage({
      extension: imageExtension,
      containerRegistery,
      service,
      context
    }),
    writeEnv({
      mainContainerName,
      project,
      domain,
      context,
      region,
      service,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        NAME: name,
        EVENT_ACTION: event.action,
        EVENT_DOMAIN: event.domain,
        EVENT_SERVICE: event.service
      }
    }),
    dockerComposeUp,
    dockerComposeProcesses,
    ...(runBaseIntegrationTests ? [baseIntegrationTests()] : []),
    ...(runIntegrationTests ? [integrationTests()] : []),
    dockerComposeLogs,
    dockerPush({
      extension: imageExtension,
      containerRegistery,
      service,
      context
    }),
    deploy({
      serviceName,
      context,
      service,
      extension: imageExtension,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      containerRegistery,
      nodeEnv: env,
      domain,
      operationHash,
      memory,
      region,
      project,
      network,
      envNameSpecifier,
      envUriSpecifier,
      env: `NAME=${name},EVENT_ACTION=${event.action},EVENT_DOMAIN=${event.domain},EVENT_SERVICE=${event.service}`,
      labels: `name=${name},event-action=${event.action},event-domain=${event.domain},event-service=${event.service}`
    }),
    startDnsTransaction({ dnsZone, project }),
    addDnsTransaction({ uri, dnsZone, project }),
    executeDnsTransaction({ dnsZone, project }),
    abortDnsTransaction({ dnsZone, project }),
    mapDomain({
      serviceName,
      uri,
      project,
      envNameSpecifier,
      region
    }),
    addPubSubPolicy({
      region,
      serviceName,
      project,
      envNameSpecifier
    }),
    createPubsubTopic({
      action: event.action,
      domain: event.domain,
      service: event.service,
      envUriSpecifier,
      network,
      project,
      envNameSpecifier
    }),
    createPubsubSubscription({
      name,
      domain,
      service,
      operationHash,
      eventAction: event.action,
      eventDomain: event.domain,
      eventService: event.service,
      context,
      region,
      envUriSpecifier,
      network,
      project,
      envNameSpecifier
    })
  ];
};
