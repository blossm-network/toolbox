const hash = require("@blossm/service-hash");

const databaseService = require("./database_service");

// const eventStoreProcedures = ({ procedures }) => {
//   let result = [];
//   for (const procedure of procedures) {
//     if (
//       procedure.context == "command-handler" &&
//       ![...procedures, ...result].some(
//         p => p.context == "event-store" && p.domain == procedure.domain
//       )
//     ) {
//       result.push({ context: "event-store", domain: procedure.domain });
//     }
//   }
//   return result;
// };

// const procedures = ({ config, domain }) => {
//   const tokenProcedures = [
//     {
//       action: "answer",
//       domain: "challenge",
//       context: "command-handler"
//     },
//     {
//       action: "issue",
//       domain: "challenge",
//       context: "command-handler"
//     },
//     {
//       domain: "challenge",
//       context: "event-store"
//     },
//     {
//       name: "permissions",
//       domain: "principle",
//       context: "view-store"
//     },
//     {
//       name: "codes",
//       domain: "challenge",
//       context: "view-store"
//     },
//     {
//       name: "phones",
//       domain: "user",
//       context: "view-store"
//     },
//     {
//       name: "contexts",
//       domain: "user",
//       context: "view-store"
//     }
//   ];

//   switch (config.context) {
//     case "command-handler":
//       return [
//         ...config.testing.procedures,
//         ...eventStoreProcedures({ procedures: config.testing.procedures }),
//         { domain, context: "event-store" }
//       ];
//     case "projection":
//       return [
//         ...config.testing.procedures,
//         { name: config.name, domain, context: "view-store" }
//       ];
//     case "command-gateway": {
//       const procedures = [
//         ...tokenProcedures,
//         ...config.commands.map(command => {
//           return {
//             action: command.action,
//             domain,
//             context: "command-handler"
//           };
//         })
//       ];
//       return [...eventStoreProcedures({ procedures }), ...procedures];
//     }
//     case "view-gateway":
//       return [
//         ...tokenProcedures,
//         ...config.stores.map(store => {
//           return {
//             name: store.name,
//             domain,
//             context: "view-store"
//           };
//         })
//       ];
//     default:
//       return config.testing.procedures;
//   }
// };

module.exports = ({
  config,
  databaseServiceKey,
  project,
  port,
  env,
  network,
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
  for (const procedure of config.testing.procedures) {
    //eslint-disable-next-line
    console.log("resolving: ", procedure);
    const commonServiceImagePrefix = `${containerRegistery}/${service}.${procedure.context}`;
    switch (procedure.context) {
      case "view-store":
        {
          const procedureHash = hash({
            procedure: [procedure.name, procedure.domain, procedure.context],
            service: config.service
          });

          const key = `${procedure.name}-${procedure.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${procedure.domain}.${procedure.name}:latest`,
              container_name: `${procedureHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: procedure.context,
                DOMAIN: procedure.domain,
                NAME: procedure.name
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "event-store":
        {
          const procedureHash = hash({
            procedure: [procedure.domain, procedure.context],
            service: config.service
          });

          const key = `${procedure.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${procedure.domain}:latest`,
              container_name: `${procedureHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: procedure.context,
                DOMAIN: procedure.domain
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "command-handler":
        {
          const procedureHash = hash({
            procedure: [procedure.action, procedure.domain, procedure.context],
            service: config.service
          });
          const key = `${procedure.action}-${procedure.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${procedure.domain}.${procedure.action}:latest`,
              container_name: `${procedureHash}.${network}`,
              environment: {
                ...commonEnvironment,
                CONTEXT: procedure.context,
                DOMAIN: procedure.domain,
                ACTION: procedure.action
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
