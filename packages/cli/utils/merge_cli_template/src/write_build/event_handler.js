const yarnInstall = require("./steps/yarn_install");
const unitTest = require("./steps/unit_tests");
const buildImage = require("./steps/build_image");
const dockerComposeUp = require("./steps/docker_compose_up");
const dockerComposeProcesses = require("./steps/docker_compose_processes");
const integrationTests = require("./steps/integration_tests");
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

module.exports = ({
  action,
  region,
  domain,
  name,
  project,
  network,
  envUriSpecifier,
  envNameSpecifier,
  containerRegistery,
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
  secretBucketKeyRing
}) => {
  const imageExtension = `${domain}.did-${action}.${name}`;
  return [
    yarnInstall,
    unitTest,
    buildImage({
      extension: imageExtension,
      containerRegistery,
      service,
      context
    }),
    dockerComposeUp,
    dockerComposeProcesses,
    integrationTests(),
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
      nodeEnv: env,
      memory,
      region,
      project,
      network,
      envNameSpecifier,
      envUriSpecifier,
      env: `DOMAIN=${domain},ACTION=${action},NAME=${name}`,
      labels: `domain=${domain},action=${action},name=${name},hash=${operationHash}`
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
      action,
      domain,
      service,
      envUriSpecifier,
      network,
      project,
      envNameSpecifier
    }),
    createPubsubSubscription({
      service,
      operationHash,
      action,
      domain,
      region,
      envUriSpecifier,
      network,
      project,
      envNameSpecifier,
      name
    })
  ];
};
