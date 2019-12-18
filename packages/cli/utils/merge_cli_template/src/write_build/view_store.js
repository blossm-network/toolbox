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
  region,
  domain,
  name,
  project,
  network,
  memory,
  envUriSpecifier,
  envNameSpecifier,
  dnsZone,
  service,
  context,
  operationHash,
  operationName,
  serviceName,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  env,
  uri
}) => {
  const imageExtension = `${domain}.${name}`;
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
      extension: imageExtension,
      region,
      project,
      network,
      memory,
      envNameSpecifier,
      envUriSpecifier,
      operationHash,
      operationName,
      service: serviceName,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      nodeEnv: env,
      env: `DOMAIN=${domain},NAME=${name},MONGODB_DATABASE=view-store,MONGODB_USER=${mongodbUser}${envNameSpecifier},MONGODB_HOST=${env}-${mongodbHost},MONGODB_PROTOCOL=${mongodbProtocol}`,
      labels: "domain=${_DOMAIN},name=${_NAME},hash=${_OPERATION_HASH}"
    }),
    startDnsTransaction({ dnsZone }),
    addDnsTransaction({ uri, dnsZone, project }),
    executeDnsTransaction({ dnsZone, project }),
    abortDnsTransaction({ dnsZone, project }),
    mapDomain({
      service: serviceName,
      uri,
      project,
      envNameSpecifier,
      region
    })
  ];
};
