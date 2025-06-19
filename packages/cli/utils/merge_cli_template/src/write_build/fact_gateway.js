import yarnInstall from "./steps/yarn_install";
import buildImage from "./steps/build_image";
import unitTests from "./steps/unit_tests";
import baseUnitTests from "./steps/base_unit_tests";
import dockerComposeUp from "./steps/docker_compose_up";
import dockerComposeProcesses from "./steps/docker_compose_processes";
import baseIntegrationTests from "./steps/base_integration_tests";
import integrationTests from "./steps/integration_tests";
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
  domain,
  region,
  project,
  network,
  publicKeyUrl,
  envUriSpecifier,
  containerRegistery,
  mainContainerName,
  baseNetwork,
  serviceName,
  localBaseNetwork,
  localNetwork,
  dnsZone,
  computeUrlId,
  service,
  procedure,
  operationHash,
  timeout,
  host,
  memory,
  env,
  redisIp,
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
  strict,
  checkInPath,
  checkInSchedule,
}) => {
  const authUri = `f${domain ? `.${domain}` : ""}${
    service ? `.${service}` : ""
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
      localBaseNetwork,
      localNetwork,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        ...dependencyKeyEnvironmentVariables,
        ...(domain && { DOMAIN: domain }),
        ...(service && { SERVICE: service }),
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
            baseNetwork,
            rolesBucket,
            secretBucket,
            computeUrlId,
            operationHash,
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
            redisIp,
            envUriSpecifier,
            env: {
              ...dependencyKeyEnvironmentVariables,
              ...(domain && { DOMAIN: domain }),
              ...(service && { SERVICE: service }),
              ...(publicKeyUrl && { PUBLIC_KEY_URL: publicKeyUrl }),
            },
            labels: { ...(domain && { domain }), ...(service && { service }) },
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
            name: `fact-gateway${service ? `-${service}` : ""}${
              domain ? `-${domain}` : ""
            }-check-in`,
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
