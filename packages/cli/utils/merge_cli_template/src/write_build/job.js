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
const deploy = require("./steps/deploy");
const startDnsTransaction = require("./steps/start_dns_transaction");
const addDnsTransaction = require("./steps/add_dns_transaction");
const executeDnsTransaction = require("./steps/execute_dns_transaction");
const abortDnsTransaction = require("./steps/abort_dns_transaction");
const mapDomain = require("./steps/map_domain");
const writeEnv = require("./steps/write_env");

module.exports = ({
  name,
  domain,
  region,
  project,
  envUriSpecifier,
  dnsZone,
  service,
  procedure,
  env,
  operationHash,
  serviceName,
  computeUrlId,
  memory,
  containerRegistery,
  mainContainerName,
  uri,
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
  strict
}) => {
  return [
    yarnInstall,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
    buildImage({
      extension: imageExtension,
      containerRegistery,
      procedure
    }),
    writeEnv({
      mainContainerName,
      project,
      region,
      procedure,
      operationHash,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        NAME: name,
        ...dependencyKeyEnvironmentVariables,
        ...(domain && { DOMAIN: domain }),
        ...(service && { SERVICE: service })
      }
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
            procedure
          }),
          deploy({
            serviceName,
            procedure,
            extension: imageExtension,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            envUriSpecifier,
            operationHash,
            computeUrlId,
            memory,
            region,
            project,
            nodeEnv: env,
            env: {
              NAME: name,
              ...(domain && { DOMAIN: domain }),
              ...(service && { SERVICE: service }),
              ...dependencyKeyEnvironmentVariables
            },
            labels: {
              name,
              ...(domain && { domain }),
              ...(service && { service })
            }
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            serviceName,
            uri,
            project,
            region
          })
        ]
      : [dockerComposeLogs])
  ];
};
