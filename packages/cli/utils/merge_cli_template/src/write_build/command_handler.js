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
const createPubsubTopic = require("./steps/create_pubsub_topic");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");

module.exports = ({
  action,
  region,
  domain,
  project,
  network,
  envUriSpecifier,
  envNameSpecifier,
  uri,
  dnsZone,
  service,
  env,
  operationHash,
  serviceName,
  context,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing
}) => {
  const imageExtension = `${domain}.${action}`;
  return [
    yarnInstall,
    unitTest,
    buildImage({
      extension: imageExtension,
      project,
      envNameSpecifier,
      service,
      context
    }),
    dockerComposeUp,
    dockerComposeProcesses,
    integrationTests(),
    dockerComposeLogs,
    dockerPush({
      extension: imageExtension,
      project,
      envNameSpecifier,
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
      region,
      project,
      network,
      envNameSpecifier,
      envUriSpecifier,
      nodeEnv: env,
      env: `DOMAIN=${domain},ACTION=${action}`,
      labels: `domain=${domain},action=${action},hash=${operationHash}`
    }),
    startDnsTransaction({ dnsZone, project }),
    addDnsTransaction({ uri, dnsZone, project }),
    executeDnsTransaction({ dnsZone, project }),
    abortDnsTransaction({ dnsZone, project }),
    mapDomain({
      uri,
      project,
      envNameSpecifier,
      region,
      serviceName
    }),
    createPubsubTopic({
      action,
      domain,
      service,
      envUriSpecifier,
      network,
      project,
      envNameSpecifier
    })
  ];
};
