import yarnInstall from "./steps/yarn_install";
import unitTests from "./steps/unit_tests";
import baseUnitTests from "./steps/base_unit_tests";
import buildImage from "./steps/build_image";
import dockerComposeUp from "./steps/docker_compose_up";
import dockerComposeProcesses from "./steps/docker_compose_processes";
import baseIntegrationTests from "./steps/base_integration_tests";
import integrationTests from "./steps/integration_tests";
import dockerComposeLogs from "./steps/docker_compose_logs";
import scheduleJob from "./steps/schedule_job";
import dockerPush from "./steps/docker_push";
import deployRun from "./steps/deploy_run";
import startDnsTransaction from "./steps/start_dns_transaction";
import addDnsTransaction from "./steps/add_dns_transaction";
import executeDnsTransaction from "./steps/execute_dns_transaction";
import abortDnsTransaction from "./steps/abort_dns_transaction";
import mapDomain from "./steps/map_domain";
import writeEnv from "./steps/write_env";

export default ({
  name,
  domain,
  region,
  project,
  envUriSpecifier,
  baseNetwork,
  dnsZone,
  service,
  procedure,
  network,
  localBaseNetwork,
  localNetwork,
  env,
  operationHash,
  serviceName,
  computeUrlId,
  timeout,
  memory,
  containerRegistery,
  mainContainerName,
  uri,
  host,
  envVars,
  devEnvVars,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  redisIp,
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
      operationHash,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      serviceName,
      localBaseNetwork,
      localNetwork,
      custom: {
        NAME: name,
        ...dependencyKeyEnvironmentVariables,
        ...(domain && { DOMAIN: domain }),
        ...(service && { SERVICE: service }),
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
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            envUriSpecifier,
            operationHash,
            computeUrlId,
            baseNetwork,
            host,
            timeout,
            memory,
            network,
            region,
            project,
            redisIp,
            nodeEnv: env,
            env: {
              NAME: name,
              ...(domain && { DOMAIN: domain }),
              ...(service && { SERVICE: service }),
              ...dependencyKeyEnvironmentVariables,
              ...envVars,
              ...devEnvVars,
            },
            labels: {
              name,
              ...(domain && { domain }),
              ...(service && { service }),
            },
          }),
          startDnsTransaction({ dnsZone, project }),
          addDnsTransaction({ uri, dnsZone, project }),
          executeDnsTransaction({ dnsZone, project }),
          abortDnsTransaction({ dnsZone, project }),
          mapDomain({
            serviceName,
            uri,
            project,
            region,
          }),
          scheduleJob({
            name: `fact${service ? `-${service}` : ""}${
              domain ? `-${domain}` : ""
            }-${name}-check-in`,
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
