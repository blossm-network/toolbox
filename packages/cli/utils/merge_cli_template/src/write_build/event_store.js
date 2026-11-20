import databaseName from "../database_name.js";
import postgresEnv, { postgresPasswordEnv } from "../postgres_env.js";
import yarnInstall from "./steps/yarn_install.js";
import unitTests from "./steps/unit_tests.js";
import baseUnitTests from "./steps/base_unit_tests.js";
import buildImage from "./steps/build_image.js";
import dockerComposeUp from "./steps/docker_compose_up.js";
import dockerComposeProcesses from "./steps/docker_compose_processes.js";
import baseIntegrationTests from "./steps/base_integration_tests.js";
import integrationTests from "./steps/integration_tests.js";
import dockerComposeLogs from "./steps/docker_compose_logs.js";
import dockerPush from "./steps/docker_push.js";
import deployRun from "./steps/deploy_run.js";
import createKeyRing from "./steps/create_key_ring.js";
import createSymmetricEncryptKey from "./steps/create_symmetric_encrypt_key.js";
import createAsymmetricSignKey from "./steps/create_asymmetric_sign_key.js";
import scheduleJob from "./steps/schedule_job.js";
// import startDnsTransaction from "./steps/start_dns_transaction.js";
// import addDnsTransaction from "./steps/add_dns_transaction.js";
// import executeDnsTransaction from "./steps/execute_dns_transaction.js";
// import abortDnsTransaction from "./steps/abort_dns_transaction.js";
import createPubsubTopic from "./steps/create_pubsub_topic.js";
// import mapDomain from "./steps/map_domain.js";
import writeEnv from "./steps/write_env.js";
import createQueue from "./steps/create_queue.js";
import updateQueue from "./steps/update_queue.js";
import addIamPolicyBinding from "./steps/add_iam_policy_binding.js";

export default ({
  cloudRun,
  eventStoreKind,
  postgres,
  domain,
  region,
  project,
  network,
  actions,
  envUriSpecifier,
  // dnsZone,
  service,
  coreNetwork,
  procedure,
  computeUrlId,
  timeout,
  memory,
  env,
  serviceName,
  blockSchedule,
  isPublic,
  host,
  containerRegistery,
  mainContainerName,
  uri,
  localCoreNetwork,
  localNetwork,
  operationHash,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbHost,
  mongodbProtocol,
  imageExtension,
  runUnitTests,
  runBaseUnitTests,
  runIntegrationTests,
  runBaseIntegrationTests,
  dependencyKeyEnvironmentVariables,
  redisHost,
  redisPort,
  strict,
  checkInPath,
  checkInSchedule,
}) => {
  const database = databaseName({ procedure: "event-store", service, domain });
  // Block creation encrypts event payloads and snapshot state with the
  // `private` key unless blossm.yaml sets `isPublic`. The entrypoints apply
  // this same truthiness to the value in config.json, so a public store gets
  // neither the key nor the grant. Every store signs with `producer`.
  const encrypts = !isPublic;
  const blockchainKeys = [
    createKeyRing({
      name: `${serviceName}-blockchain`,
      location: "global",
      project,
    }),
    ...(encrypts
      ? [
          createSymmetricEncryptKey({
            name: "private",
            ring: `${serviceName}-blockchain`,
            location: "global",
            rotation: "90d",
            next: "+p90d",
            project,
          }),
        ]
      : []),
    createAsymmetricSignKey({
      name: "producer",
      ring: `${serviceName}-blockchain`,
      location: "global",
      project,
    }),
  ];
  // The local PostgreSQL store signs with a disposable key, so its test-only
  // builds never touch KMS. Mongo keeps its keys ahead of its local tests.
  const needsKeys = strict || eventStoreKind != "postgres";
  // Tasks are enqueued in GCP_REGION under these names: `add` uses the store
  // queue and a full block continues through the create-block queue.
  const queues = ["", "-create-block"].flatMap((suffix) => {
    const queue = {
      name: `event-store-${service}-${domain}${suffix}`,
      project,
      region,
      //Throttles for block creation. TODO increase when scale is necessary.
      maxDispatchPerSecond: 10,
      maxConcurrentDispatches: 100,
    };
    return [createQueue(queue), updateQueue(queue)];
  });
  const topics = actions.map((action) =>
    createPubsubTopic({ action, domain, service, project }),
  );
  // Cloud Run keeps a service's previous identity when none is passed, so the
  // default is named explicitly and the grants below always match the
  // revision. Builds are submitted to `project`, so Cloud Build substitutes
  // its number into the default compute account Cloud Run would use.
  const runtime =
    cloudRun?.serviceAccount ??
    "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com";
  // Task and Scheduler requests arrive with this account's OIDC token.
  const executer = `executer@${project}.iam.gserviceaccount.com`;
  // Without a condition choice, gcloud will not add a binding non-interactively
  // to a policy that already holds a conditional one. KMS keys, service
  // accounts and Cloud Run services accept an explicit unconditional choice,
  // which leaves the conditional bindings in place. The GA topic and queue
  // commands have no such flag and must not be given one.
  const unconditional = "--condition=None";
  const key = (name) => ({
    group: ["kms", "keys"],
    name,
    flags: [
      `--keyring=${serviceName}-blockchain`,
      "--location=global",
      unconditional,
    ],
  });
  // What the running store calls: KMS for blocks, its topics for publication,
  // and its create-block queue to continue a full block as the executer.
  // Callers that enqueue `add` on the store queue hold their own grants.
  const runtimeBindings = [
    ...(encrypts
      ? [{ ...key("private"), role: "roles/cloudkms.cryptoKeyEncrypter" }]
      : []),
    { ...key("producer"), role: "roles/cloudkms.signer" },
    { ...key("producer"), role: "roles/cloudkms.publicKeyViewer" },
    ...actions.map((action) => ({
      group: ["pubsub", "topics"],
      name: `${action}.${domain}.${service}`,
      role: "roles/pubsub.publisher",
    })),
    {
      group: ["tasks", "queues"],
      name: `event-store-${service}-${domain}-create-block`,
      flags: [`--location=${region}`],
      role: "roles/cloudtasks.enqueuer",
    },
    {
      group: ["iam", "service-accounts"],
      name: executer,
      flags: [unconditional],
      role: "roles/iam.serviceAccountUser",
    },
  ].map((binding) =>
    addIamPolicyBinding({ ...binding, member: runtime, project }),
  );
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
      procedure,
      operationHash,
      localCoreNetwork,
      localNetwork,
      region,
      secretBucket,
      secretBucketKeyRing,
      secretBucketKeyLocation,
      custom: {
        DOMAIN: domain,
        SERVICE: service,
        ...dependencyKeyEnvironmentVariables,
      },
    }),
    ...(needsKeys ? blockchainKeys : []),
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
          // Everything the store uses at startup exists and is granted
          // before its first revision starts.
          ...queues,
          ...topics,
          ...runtimeBindings,
          deployRun({
            cloudRun: { ...cloudRun, serviceAccount: runtime },
            serviceName,
            procedure,
            extension: imageExtension,
            coreNetwork,
            rolesBucket,
            secretBucket,
            secretBucketKeyLocation,
            secretBucketKeyRing,
            containerRegistery,
            computeUrlId,
            operationHash,
            host,
            region,
            timeout,
            memory,
            project,
            envUriSpecifier,
            network,
            nodeEnv: env,
            redisHost,
            redisPort,
            env: {
              DOMAIN: domain,
              SERVICE: service,
              ...(postgres
                ? postgresEnv({
                    // Cloud Run mounts the instance's Unix socket here.
                    host: `/cloudsql/${postgres.cloudSqlInstance}`,
                    database: postgres.database,
                    user: postgres.user,
                    max: postgres.max,
                    namespace: database,
                  })
                : {
                    MONGODB_DATABASE: database,
                    MONGODB_USER: mongodbUser,
                    MONGODB_HOST: mongodbHost,
                    MONGODB_PROTOCOL: mongodbProtocol,
                  }),
              ...dependencyKeyEnvironmentVariables,
            },
            ...(postgres && {
              cloudSqlInstance: postgres.cloudSqlInstance,
              secrets: { [postgresPasswordEnv]: postgres.passwordSecret },
            }),
            labels: { domain, service },
          }),
          addIamPolicyBinding({
            group: ["run", "services"],
            name: serviceName,
            flags: [`--region=${region}`, "--platform=managed", unconditional],
            member: executer,
            role: "roles/run.invoker",
            project,
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
            name: `event-store-${service}-${domain}-create-block`,
            schedule: blockSchedule,
            region,
            serviceName,
            computeUrlId,
            uri: `${uri}/create-block`,
            project,
          }),
          scheduleJob({
            name: `event-store-${service}-${domain}-check-in`,
            schedule: checkInSchedule,
            region,
            serviceName,
            computeUrlId,
            uri: `${uri}/${checkInPath}`,
            method: "get",
            project,
          }),
        ]
      : [dockerComposeLogs({ runBaseIntegrationTests, runIntegrationTests })]),
  ];
};
