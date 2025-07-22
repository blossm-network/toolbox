import yarnInstall from "./steps/yarn_install.js";
import unitTests from "./steps/unit_tests.js";
import baseUnitTests from "./steps/base_unit_tests.js";
import buildImage from "./steps/build_image.js";
import dockerComposeUp from "./steps/docker_compose_up.js";
import dockerComposeProcesses from "./steps/docker_compose_processes.js";
import integrationTests from "./steps/integration_tests.js";
import baseIntegrationTests from "./steps/base_integration_tests.js";
import dockerComposeLogs from "./steps/docker_compose_logs.js";
import dockerPush from "./steps/docker_push.js";
import deployRun from "./steps/deploy_run.js";
import scheduleJob from "./steps/schedule_job.js";
// import startDnsTransaction from "./steps/start_dns_transaction.js";
// import addDnsTransaction from "./steps/add_dns_transaction.js";
// import executeDnsTransaction from "./steps/execute_dns_transaction.js";
// import abortDnsTransaction from "./steps/abort_dns_transaction.js";
// import mapDomain from "./steps/map_domain.js";
import writeEnv from "./steps/write_env.js";

export default ({
  region,
  domain,
  name,
  project,
  network,
  context,
  service,
  timeout,
  memory,
  localCoreNetwork,
  localNetwork,
  host,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  coreNetwork,
  // dnsZone,
  procedure,
  computeUrlId,
  operationHash,
  serviceName,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  env,
  uri,
  redisHost,
  redisPort,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
  strict,
  checkInPath,
  checkInSchedule,
}) => {
  return [
    yarnInstall,
    buildImage({
      extension: imageExtension,
      containerRegistery,
      procedure,
    }),
    writeEnv({
      mainContainerName,
      project,
      region,
      procedure,
      localCoreNetwork,
      localNetwork,
      serviceName,
      operationHash,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        NAME: name,
        ...(domain && { DOMAIN: domain }),
        ...(service && { SERVICE: service }),
        CONTEXT: context,
        ...dependencyKeyEnvironmentVariables,
      },
    }),
    dockerComposeUp,
    dockerComposeProcesses,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
    ...(runBaseIntegrationTests ? [baseIntegrationTests({ strict })] : []),
    ...(runIntegrationTests ? [integrationTests({ strict })] : []),
    ...(strict
      ? [
          dockerPush({
            extension: imageExtension,
            containerRegistery,
            procedure,
          }),
          deployRun({
            serviceName,
            extension: imageExtension,
            region,
            project,
            coreNetwork,
            operationHash,
            computeUrlId,
            procedure,
            network,
            timeout,
            memory,
            host,
            containerRegistery,
            envUriSpecifier,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            redisHost,
            redisPort,
            nodeEnv: env,
            env: {
              NAME: name,
              ...(domain && { DOMAIN: domain }),
              ...(service && { SERVICE: service }),
              CONTEXT: context,
              ...dependencyKeyEnvironmentVariables,
            },
            labels: {
              name,
              ...(domain && { domain }),
              ...(service && { service }),
              context,
            },
          }),
          // startDnsTransaction({ dnsZone, project }),
          // addDnsTransaction({ uri, dnsZone, project }),
          // executeDnsTransaction({ dnsZone, project }),
          // abortDnsTransaction({ dnsZone, project }),
          // mapDomain({
          //   serviceName,
          //   uri,
          //   project,
          //   region,
          // }),
          scheduleJob({
            name: `view-composite${
              context ? `-${context}` : ""
            }-${name}-check-in`,
            schedule: checkInSchedule,
            serviceName,
            region,
            computeUrlId,
            uri: `${uri}/${checkInPath}`,
            method: "get",
            project,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
