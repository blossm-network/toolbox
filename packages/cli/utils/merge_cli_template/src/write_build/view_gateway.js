const yarnInstall = require("./steps/yarn_install");
const buildImage = require("./steps/build_image");
const unitTests = require("./steps/unit_tests");
const baseUnitTests = require("./steps/base_unit_tests");
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
  domain,
  region,
  project,
  network,
  publicKeyUrl,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  serviceName,
  dnsZone,
  computeUrlId,
  service,
  procedure,
  operationHash,
  memory,
  env,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  routerNetwork,
  routerKeyId,
  routerKeySecretName,
  strict
}) => {
  const authUri = `view.${domain}.${service}.${envUriSpecifier}${network}`;
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
      routerNetwork,
      routerKeyId,
      routerKeySecretName,
      custom: {
        DOMAIN: domain,
        SERVICE: service,
        ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl })
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
            extension: imageExtension,
            serviceName,
            allowUnauthenticated: true,
            procedure,
            rolesBucket,
            secretBucket,
            computeUrlId,
            operationHash,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            nodeEnv: env,
            memory,
            region,
            project,
            network,
            envUriSpecifier,
            routerNetwork,
            routerKeyId,
            routerKeySecretName,
            env: {
              DOMAIN: domain,
              SERVICE: service,
              ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl })
            },
            labels: { domain, service }
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri: authUri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            uri: authUri,
            project,
            region,
            serviceName
          })
        ]
      : [dockerComposeLogs])
  ];
};
