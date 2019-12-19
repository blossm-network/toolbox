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
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");

module.exports = ({
  domain,
  region,
  project,
  network,
  envNameSpecifier,
  envUriSpecifier,
  dnsZone,
  service,
  context,
  memory,
  env,
  serviceName,
  containerRegistery,
  uri,
  operationHash,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol
}) => {
  const imageExtension = `${domain}`;
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
      region,
      memory,
      project,
      envNameSpecifier,
      envUriSpecifier,
      network,
      nodeEnv: env,
      env: `DOMAIN=${domain},MONGODB_DATABASE=event-store,MONGODB_USER=${mongodbUser}${envNameSpecifier},MONGODB_HOST=${env}-${mongodbHost},MONGODB_PROTOCOL=${mongodbProtocol}`,
      labels: `domain=${domain},hash=${operationHash}`
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
    })
  ];
};
