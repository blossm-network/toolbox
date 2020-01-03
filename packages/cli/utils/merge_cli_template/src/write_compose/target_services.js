const hash = require("@blossm/service-hash");

const databaseService = require("./database_service");

const eventStoreTargets = ({ targets }) => {
  let result = [];
  for (const target of targets) {
    if (
      target.context == "command-handler" &&
      ![...targets, ...result].some(
        t => t.context == "event-store" && t.domain == target.domain
      )
    ) {
      result.push({ context: "event-store", domain: target.domain });
    }
  }
  return result;
};

const targets = ({ config, domain }) => {
  const tokenTargets = [
    {
      action: "answer",
      domain: "challenge",
      context: "command-handler"
    },
    {
      action: "issue",
      domain: "challenge",
      context: "command-handler"
    },
    {
      domain: "challenge",
      context: "event-store"
    },
    {
      name: "permissions",
      domain: "principle",
      context: "view-store"
    },
    {
      name: "codes",
      domain: "challenge",
      context: "view-store"
    },
    {
      name: "phones",
      domain: "person",
      context: "view-store"
    },
    {
      name: "contexts",
      domain: "person",
      context: "view-store"
    }
  ];

  switch (config.context) {
    case "command-handler":
      return [
        ...config.testing.targets,
        ...eventStoreTargets({ targets: config.testing.targets }),
        { domain, context: "event-store" }
      ];
    case "command-gateway": {
      const targets = [
        ...tokenTargets,
        ...config.commands.map(command => {
          return {
            action: command.action,
            domain,
            context: "command-handler"
          };
        })
      ];
      return [...eventStoreTargets({ targets }), ...targets];
    }
    case "view-gateway":
      return [
        ...tokenTargets,
        ...config.stores.map(store => {
          return {
            name: store.name,
            domain,
            context: "view-store"
          };
        })
      ];
    default:
      return config.testing.targets;
  }
};

module.exports = ({
  config,
  databaseServiceKey,
  project,
  port,
  env,
  network,
  domain,
  service,
  region,
  containerRegistery,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbAdminUser,
  mongodbAdminUserPassword,
  mongodbAdminDatabase,
  mongodbDatabase,
  mongodbHost,
  mongodbProtocol,
  mongodbUser,
  mongodbUserPassword
}) => {
  const common = {
    ports: [`${port}`]
  };
  const commonEnvironment = {
    PORT: `${port}`,
    NODE_ENV: `${env}`,
    NETWORK: `${network}`,
    SERVICE: `${service}`,
    GCP_PROJECT: `${project}-staging`,
    GCP_REGION: `${region}`,
    GCP_SECRET_BUCKET: `${secretBucket}`,
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION: `${secretBucketKeyLocation}`,
    GCP_KMS_SECRET_BUCKET_KEY_RING: `${secretBucketKeyRing}`
  };
  const commonStoreEnvironment = {
    MONGODB_USER: `${mongodbUser}`,
    MONGODB_HOST: `${mongodbHost}`,
    MONGODB_USER_PASSWORD: `${mongodbUserPassword}`,
    MONGODB_PROTOCOL: `${mongodbProtocol}`,
    MONGODB_DATABASE: `${mongodbDatabase}`
  };
  let services = {};
  let includeDatabase = false;
  for (const target of targets({ config, domain })) {
    const commonServiceImagePrefix = `${containerRegistery}/${service}.${target.context}`;
    switch (target.context) {
      case "view-store":
        {
          const targetHash = hash({
            procedure: [target.name, target.domain, target.context],
            service: config.service
          });

          const key = `${target.name}-${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}.${target.name}:latest`,
              container_name: `${targetHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: target.context,
                DOMAIN: target.domain,
                NAME: target.name
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "event-store":
        {
          const targetHash = hash({
            procedure: [target.domain, target.context],
            service: config.service
          });

          const key = `${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}:latest`,
              container_name: `${targetHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: target.context,
                DOMAIN: target.domain
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "command-handler":
        {
          const targetHash = hash({
            procedure: [target.action, target.domain, target.context],
            service: config.service
          });
          const key = `${target.action}-${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}.${target.action}:latest`,
              container_name: `${targetHash}.${network}`,
              environment: {
                ...commonEnvironment,
                CONTEXT: target.context,
                DOMAIN: target.domain,
                ACTION: target.action
              }
            }
          };
        }
        break;
    }
  }
  return {
    ...services,
    ...(includeDatabase
      ? {
          [databaseServiceKey]: databaseService({
            adminUser: mongodbAdminUser,
            adminUserPassword: mongodbAdminUserPassword,
            adminDatabase: mongodbAdminDatabase,
            database: mongodbDatabase,
            user: mongodbUser,
            userPassword: mongodbUserPassword
          })
        }
      : [])
  };
};
