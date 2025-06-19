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
import deployRun from "./steps/deploy_run";
import startDnsTransaction from "./steps/start_dns_transaction";
import scheduleJob from "./steps/schedule_job";
import addDnsTransaction from "./steps/add_dns_transaction";
import executeDnsTransaction from "./steps/execute_dns_transaction";
import abortDnsTransaction from "./steps/abort_dns_transaction";
import mapDomain from "./steps/map_domain";
import writeEnv from "./steps/write_env";

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
  localBaseNetwork,
  localNetwork,
  host,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  baseNetwork,
  dnsZone,
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
      localBaseNetwork,
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
            baseNetwork,
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
            redisIp,
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
            name: `view-composite${
              context ? `-${context}` : ""
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
