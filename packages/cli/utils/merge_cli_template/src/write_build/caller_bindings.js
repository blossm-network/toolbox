import hash from "@blossm/operation-hash";
import operationShortName from "@blossm/operation-short-name";

import addIamPolicyBinding from "./steps/add_iam_policy_binding.js";

// The access a deployed procedure needs from its callers, on its callees and
// on the keys it declares,
// granted by its own build. Every binding is additive, so a redeploy repeats
// them without effect. The event store renders its own bindings.

const publicProcedures = ["command-gateway", "fact-gateway", "view-gateway"];
// The only procedures whose generated service enqueues tasks.
const enqueuingProcedures = ["command", "projection"];

const identity = ({ name, domain, service, context, procedure }) =>
  [name, domain, service, context, procedure].filter(Boolean);

// Queue names as the rpc clients address them.
const queue = ({ name, domain, service, context, procedure }) => {
  switch (procedure) {
    case "event-store":
      return `event-store-${service}-${domain}`;
    case "command":
      return `command-${service}-${domain}-${name}`;
    case "view-store":
      return `view-store${context ? `-${context}` : ""}-${name}`;
  }
};

// What a procedure declares it does with a key, as the role that allows it.
const keyRoles = {
  sign: "roles/cloudkms.signer",
  verify: "roles/cloudkms.publicKeyViewer",
  encrypt: "roles/cloudkms.cryptoKeyEncrypter",
  decrypt: "roles/cloudkms.cryptoKeyDecrypter",
};

// The declared use of each key, granted to one member. The build identity
// takes the same grants ahead of the suites, which use the real keys.
export const keyBindings = ({ keys = [], member, project }) =>
  keys.map(({ ring, name: key, location = "global", use }) => {
    if (!ring || !key || !keyRoles[use])
      throw new Error(
        `Each entry of keys needs a ring, a name and a use of ${Object.keys(
          keyRoles,
        ).join(", ")}.`,
      );
    return addIamPolicyBinding({
      group: ["kms", "keys"],
      name: key,
      flags: [
        `--keyring=${ring}`,
        `--location=${location}`,
        "--condition=None",
      ],
      member,
      role: keyRoles[use],
      project,
    });
  });

export default ({
  procedure,
  keys = [],
  name,
  context,
  callees = [],
  cloudRun: { serviceAccount } = {},
  serviceName,
  region,
  project,
}) => {
  if (procedure == "event-store") return [];
  const executer = `executer@${project}.iam.gserviceaccount.com`;
  const invoke = (target, member) =>
    addIamPolicyBinding({
      group: ["run", "services"],
      name: target,
      flags: [`--region=${region}`, "--platform=managed", "--condition=None"],
      member,
      role: "roles/run.invoker",
      project,
    });
  const queues = enqueuingProcedures.includes(procedure)
    ? [
        ...callees.map(queue).filter(Boolean),
        // A projection continues its own play through its queue.
        ...(procedure == "projection"
          ? [`projection${context ? `-${context}` : ""}-${name}-play`]
          : []),
      ]
    : [];
  return [
    // The check-in job, and any task delivered to this service, arrives as
    // the executer. A public gateway has no invoker check to pass.
    ...(publicProcedures.includes(procedure)
      ? []
      : [invoke(serviceName, executer)]),
    // Without a configured runtime identity the service runs as the
    // project's default account, whose access this build does not own.
    ...(serviceAccount
      ? [
          ...callees.map((callee) =>
            invoke(
              `${region}-${operationShortName(identity(callee))}-${hash(
                ...identity(callee),
              )}`,
              serviceAccount,
            ),
          ),
          ...queues.map((target) =>
            addIamPolicyBinding({
              group: ["tasks", "queues"],
              name: target,
              flags: [`--location=${region}`],
              member: serviceAccount,
              role: "roles/cloudtasks.enqueuer",
              project,
            }),
          ),
          ...keyBindings({ keys, member: serviceAccount, project }),
          // An enqueued task carries the executer's identity token.
          ...(queues.length
            ? [
                addIamPolicyBinding({
                  group: ["iam", "service-accounts"],
                  name: executer,
                  flags: ["--condition=None"],
                  member: serviceAccount,
                  role: "roles/iam.serviceAccountUser",
                  project,
                }),
              ]
            : []),
        ]
      : []),
  ];
};
