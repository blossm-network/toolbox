import yarnInstall from "./steps/yarn_install.js";
import buildImage from "./steps/build_image.js";
import unitTests from "./steps/unit_tests.js";
import baseUnitTests from "./steps/base_unit_tests.js";
import dockerComposeUp from "./steps/docker_compose_up.js";
import dockerComposeProcesses from "./steps/docker_compose_processes.js";
import baseIntegrationTests from "./steps/base_integration_tests.js";
import integrationTests from "./steps/integration_tests.js";
import dockerComposeLogs from "./steps/docker_compose_logs.js";
import scheduleJob from "./steps/schedule_job.js";
import dockerPush from "./steps/docker_push.js";
import deployRun from "./steps/deploy_run.js";
import startDnsTransaction from "./steps/start_dns_transaction.js";
import addDnsTransaction from "./steps/add_dns_transaction.js";
import executeDnsTransaction from "./steps/execute_dns_transaction.js";
import abortDnsTransaction from "./steps/abort_dns_transaction.js";
import mapDomain from "./steps/map_domain.js";
import writeEnv from "./steps/write_env.js";

export default ({
  region,
  project,
  network,
  publicKeyUrl,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  serviceName,
  dnsZone,
  context,
  localBaseNetwork,
  localNetwork,
  computeUrlId,
  baseNetwork,
  procedure,
  operationHash,
  timeout,
  host,
  memory,
  env,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  redisIp,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
  strict,
  checkInPath,
  checkInSchedule,
}) => {
  const authUri = `v${
    context ? `.${context}` : ""
  }.${envUriSpecifier}${network}`;
  return [
    yarnInstall,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
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
      serviceName,
      operationHash,
      secretBucket,
      localBaseNetwork,
      localNetwork,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        ...(context && { CONTEXT: context }),
        ...dependencyKeyEnvironmentVariables,
        ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl }),
      },
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
            procedure,
          }),
          deployRun({
            extension: imageExtension,
            serviceName,
            allowUnauthenticated: true,
            procedure,
            rolesBucket,
            secretBucket,
            computeUrlId,
            operationHash,
            baseNetwork,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            nodeEnv: env,
            host,
            timeout,
            memory,
            redisIp,
            region,
            project,
            network,
            envUriSpecifier,
            env: {
              ...(context && { CONTEXT: context }),
              ...dependencyKeyEnvironmentVariables,
              ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl }),
            },
            labels: {
              ...(context && { context }),
            },
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri: authUri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            uri: authUri,
            project,
            region,
            serviceName,
          }),
          scheduleJob({
            name: `view-gateway${context ? `-${context}` : ""}-check-in`,
            schedule: checkInSchedule,
            serviceName,
            computeUrlId,
            uri: `${authUri}/${checkInPath}`,
            method: "get",
            project,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
