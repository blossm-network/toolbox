import yarnInstall from "./steps/yarn_install.js";
import unitTests from "./steps/unit_tests.js";
import baseUnitTests from "./steps/base_unit_tests.js";
import buildImage from "./steps/build_image.js";
import dockerComposeUp from "./steps/docker_compose_up.js";
import dockerComposeProcesses from "./steps/docker_compose_processes.js";
import integrationTests from "./steps/integration_tests.js";
import scheduleJob from "./steps/schedule_job.js";
import baseIntegrationTests from "./steps/base_integration_tests.js";
import dockerComposeLogs from "./steps/docker_compose_logs.js";
import dockerPush from "./steps/docker_push.js";
import deployRun from "./steps/deploy_run.js";
import startDnsTransaction from "./steps/start_dns_transaction.js";
import addDnsTransaction from "./steps/add_dns_transaction.js";
import executeDnsTransaction from "./steps/execute_dns_transaction.js";
import abortDnsTransaction from "./steps/abort_dns_transaction.js";
import mapDomain from "./steps/map_domain.js";
import writeEnv from "./steps/write_env.js";

export default ({
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
  port,
  service,
  procedure,
  memory,
  localBaseNetwork,
  localNetwork,
  timeout,
  env,
  host,
  operationHash,
  computeUrlId,
  dependencyKeyEnvironmentVariables,
  rolesBucket,
  baseNetwork,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  envVars,
  devEnvVars,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  redisIp,
  strict,
  checkInPath,
  checkInSchedule,
}) => {
  const authUri = `c.${domain}.${service}.${envUriSpecifier}${network}`;
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
      port,
      project,
      region,
      procedure,
      localBaseNetwork,
      localNetwork,
      operationHash,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      serviceName,
      custom: {
        DOMAIN: domain,
        SERVICE: service,
        ...dependencyKeyEnvironmentVariables,
        ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl }),
        ...envVars,
        ...devEnvVars,
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
            baseNetwork,
            allowUnauthenticated: true,
            procedure,
            operationHash,
            computeUrlId,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            nodeEnv: env,
            host,
            timeout,
            memory,
            region,
            project,
            network,
            envUriSpecifier,
            redisIp,
            env: {
              DOMAIN: domain,
              SERVICE: service,
              ...dependencyKeyEnvironmentVariables,
              ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl }),
              ...envVars,
            },
            labels: { domain, service },
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
            name: `command-gateway-${service}-${domain}-check-in`,
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
