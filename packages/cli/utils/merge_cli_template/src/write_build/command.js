import yarnInstall from "./steps/yarn_install";
import unitTests from "./steps/unit_tests";
import baseUnitTests from "./steps/base_unit_tests";
import buildImage from "./steps/build_image";
import dockerComposeUp from "./steps/docker_compose_up";
import dockerComposeProcesses from "./steps/docker_compose_processes";
import integrationTests from "./steps/integration_tests";
import baseIntegrationTests from "./steps/base_integration_tests";
import dockerComposeLogs from "./steps/docker_compose_logs";
import dockerPush from "./steps/docker_push";
import scheduleJob from "./steps/schedule_job";
import writeEnv from "./steps/write_env";
import deployRun from "./steps/deploy_run";
import startDnsTransaction from "./steps/start_dns_transaction";
import addDnsTransaction from "./steps/add_dns_transaction";
import executeDnsTransaction from "./steps/execute_dns_transaction";
import abortDnsTransaction from "./steps/abort_dns_transaction";
import mapDomain from "./steps/map_domain";
import createQueue from "./steps/create_queue";
import updateQueue from "./steps/update_queue";

export default ({
  name,
  region,
  domain,
  project,
  network,
  mainContainerName,
  envUriSpecifier,
  containerRegistery,
  uri,
  host,
  dnsZone,
  service,
  timeout,
  memory,
  env,
  baseNetwork,
  localBaseNetwork,
  localNetwork,
  operationHash,
  serviceName,
  computeUrlId,
  procedure,
  rolesBucket,
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
  dependencyKeyEnvironmentVariables,
  redisIp,
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
      operationHash,
      localBaseNetwork,
      localNetwork,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      serviceName,
      custom: {
        DOMAIN: domain,
        SERVICE: service,
        NAME: name,
        ...dependencyKeyEnvironmentVariables,
        ...envVars,
        ...devEnvVars,
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
            procedure,
            extension: imageExtension,
            baseNetwork,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            computeUrlId,
            operationHash,
            region,
            host,
            timeout,
            memory,
            project,
            network,
            envUriSpecifier,
            redisIp,
            nodeEnv: env,
            env: {
              NAME: name,
              DOMAIN: domain,
              SERVICE: service,
              ...dependencyKeyEnvironmentVariables,
              ...envVars,
            },
            labels: { name, domain, service },
          }),
          createQueue({
            name: `command-${service}-${domain}-${name}`,
            project,
            maxDispatchPerSecond: 100,
            maxConcurrentDispatches: 100,
          }),
          updateQueue({
            name: `command-${service}-${domain}-${name}`,
            maxDispatchPerSecond: 100,
            maxConcurrentDispatches: 100,
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            uri,
            project,
            region,
            serviceName,
          }),
          scheduleJob({
            name: `command-${service}-${domain}-${name}-check-in`,
            schedule: checkInSchedule,
            serviceName,
            computeUrlId,
            uri: `${uri}/${checkInPath}`,
            method: "get",
            project,
          }),
        ]
      : [dockerComposeLogs]),
  ];
};
