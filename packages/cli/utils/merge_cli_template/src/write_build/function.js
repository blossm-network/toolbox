const yarnInstall = require("./steps/yarn_install");
const unitTests = require("./steps/unit_tests");
const baseUnitTests = require("./steps/base_unit_tests");
const deployFunction = require("./steps/deploy_function");

module.exports = ({
  name,
  domain,
  region,
  project,
  envUriSpecifier,
  service,
  procedure,
  network,
  env,
  operationHash,
  serviceName,
  computeUrlId,
  memory,
  timeout,
  envVars,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  runUnitTests,
  runBaseUnitTests,
}) => {
  return [
    yarnInstall,
    ...(runUnitTests ? [unitTests] : []),
    ...(runBaseUnitTests ? [baseUnitTests] : []),
    deployFunction({
      serviceName,
      procedure,
      rolesBucket,
      secretBucket,
      secretBucketKeyLocation,
      secretBucketKeyRing,
      envUriSpecifier,
      timeout,
      operationHash,
      computeUrlId,
      memory,
      network,
      region,
      project,
      nodeEnv: env,
      env: {
        NAME: name,
        ...envVars,
      },
      labels: {
        name,
        ...(domain && { domain }),
        ...(service && { service }),
      },
    }),
  ];
};
