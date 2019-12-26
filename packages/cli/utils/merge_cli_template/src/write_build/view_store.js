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
const writeEnv = require("./steps/write_env");

module.exports = ({
  region,
  domain,
  name,
  project,
  network,
  memory,
  envUriSpecifier,
  envNameSpecifier,
  containerRegistery,
  mainContainerName,
  dnsZone,
  service,
  context,
  operationHash,
  serviceName,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  env,
  uri,
  imageExtension
}) => {
  return [
    yarnInstall,
    unitTest,
    buildImage({
      extension: imageExtension,
      containerRegistery,
      service,
      context
    }),
    writeEnv({
      mainContainerName,
      project,
      region,
      domain,
      context,
      service,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: { NAME: name }
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
      extension: imageExtension,
      region,
      project,
      domain,
      operationHash,
      context,
      service,
      network,
      memory,
      containerRegistery,
      envNameSpecifier,
      envUriSpecifier,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      nodeEnv: env,
      env: `NAME=${name},MONGODB_DATABASE=view-store,MONGODB_USER=${mongodbUser}${envNameSpecifier},MONGODB_HOST=${env}-${mongodbHost},MONGODB_PROTOCOL=${mongodbProtocol}`,
      labels: `name=${name}`
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
