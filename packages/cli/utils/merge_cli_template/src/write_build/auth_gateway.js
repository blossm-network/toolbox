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
  project,
  network,
  envNameSpecifier,
  envUriSpecifier,
  dnsZone,
  service,
  context,
  env,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing
}) => {
  const authServiceName = `${region}-${service}-${context}`;
  const authUri = `auth.${envUriSpecifier}${network}`;
  return [
    yarnInstall,
    unitTest,
    buildImage({
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
      project,
      envNameSpecifier,
      service,
      context
    }),
    deploy({
      serviceName: authServiceName,
      allowUnauthenticated: true,
      context,
      service,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      nodeEnv: env,
      region,
      project,
      network,
      envNameSpecifier,
      envUriSpecifier
    }),
    startDnsTransaction,
    addDnsTransaction({ uri: authUri, dnsZone, project }),
    executeDnsTransaction({ dnsZone, project }),
    abortDnsTransaction({ dnsZone, project }),
    mapDomain({
      uri: authUri,
      project,
      envNameSpecifier,
      region,
      serviceName: authServiceName
    })
  ];
};
