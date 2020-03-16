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
const createPubsubTopic = require("./steps/create_pubsub_topic");
const mapDomain = require("./steps/map_domain");
const writeEnv = require("./steps/write_env");

module.exports = ({
  domain,
  region,
  project,
  network,
  envUriSpecifier,
  dnsZone,
  service,
  procedure,
  computeUrlId,
  memory,
  env,
  serviceName,
  containerRegistery,
  mainContainerName,
  uri,
  operationHash,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  actions,
  strict
}) => {
  return [
    yarnInstall,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
    buildImage({
      extension: imageExtension,
      containerRegistery,
      service,
      procedure
    }),
    writeEnv({
      mainContainerName,
      project,
      domain,
      procedure,
      region,
      service,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation
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
            service,
            procedure
          }),
          deploy({
            serviceName,
            procedure,
            service,
            extension: imageExtension,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            domain,
            computeUrlId,
            operationHash,
            region,
            memory,
            project,
            envUriSpecifier,
            network,
            nodeEnv: env,
            env: `MONGODB_DATABASE=event-store,MONGODB_USER=${mongodbUser},MONGODB_HOST=${mongodbHost},MONGODB_PROTOCOL=${mongodbProtocol}`
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
          }),
          ...actions.map(action =>
            createPubsubTopic({
              action,
              domain,
              service,
              project
            })
          )
        ]
      : [dockerComposeLogs])
  ];
};
