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
// const writeEnv = require("./steps/write_env");

module.exports = ({
  domain,
  region,
  project,
  network,
  envNameSpecifier,
  envUriSpecifier,
  containerRegistery,
  // mainContainerName,
  // operationHash,
  serviceName,
  dnsZone,
  service,
  context,
  memory,
  env,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  imageExtension
}) => {
  const authUri = `${domain}.${service}.${envUriSpecifier}${network}`;
  return [
    yarnInstall,
    unitTest,
    buildImage({
      extension: imageExtension,
      containerRegistery,
      service,
      context
    }),
    // writeEnv({
    //   mainContainerName,
    //   domain,
    //   project,
    //   region,
    //   context,
    //   operationHash,
    //   service,
    //   secretBucket,
    //   secretBucketKeyRing,
    //   secretBucketKeyLocation
    // }),
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
      extension: imageExtension,
      serviceName,
      allowUnauthenticated: true,
      context,
      service,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      containerRegistery,
      nodeEnv: env,
      memory,
      domain,
      region,
      project,
      network,
      envNameSpecifier,
      envUriSpecifier
    }),
    startDnsTransaction({ dnsZone, project }),
    addDnsTransaction({ uri: authUri, dnsZone, project }),
    executeDnsTransaction({ dnsZone, project }),
    abortDnsTransaction({ dnsZone, project }),
    mapDomain({
      uri: authUri,
      project,
      envNameSpecifier,
      region,
      serviceName
    })
  ];
};
