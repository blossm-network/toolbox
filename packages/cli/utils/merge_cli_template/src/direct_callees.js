// The services a deployed procedure calls itself, read from the same
// declarations that assemble its integration tests. Unlike the test
// dependencies, nothing here is transitive or mocked: each entry is one
// service this procedure's runtime identity must be allowed to reach.

// What a gateway's authorization checks read for a strict route.
const strictRouteFacts = [
  { name: "terminated", domain: "session", service: "core" },
  { name: "deleted", domain: "scene", service: "core" },
  { name: "roles", domain: "principal", service: "core" },
  { name: "permissions", domain: "role", service: "core" },
].map((fact) => ({ ...fact, procedure: "fact" }));

const isStrict = ({ protection }) =>
  protection == undefined || protection == "strict";

// A route to another network leaves through that network's gateway, and a
// local route is served by the gateway itself.
const routed = (routes = []) => routes.filter((r) => !r.network && !r.local);

// A dependency with mocks or a network stands in for something outside
// this deployment.
const declared = (config) =>
  ((config.testing || {}).dependencies || [])
    .filter((d) => d.procedure && !d.mocks && !d.network)
    .map(({ name, domain, service, context, procedure }) => ({
      ...(name && { name }),
      ...(domain && { domain }),
      ...(service && { service }),
      ...(context && { context }),
      procedure,
    }));

const gateway = ({ routes, coreIsOwn, callee }) => [
  ...routed(routes).map(callee),
  ...(coreIsOwn && (routes || []).some(isStrict) ? strictRouteFacts : []),
];

export default (config, { coreIsOwn = true } = {}) => {
  const { domain, service, context } = config;
  const own = [
    ...(() => {
      switch (config.procedure) {
        case "command":
          return (config.testing || {}).store === false
            ? []
            : [{ domain, service, procedure: "event-store" }];
        case "projection":
          return [
            ...(config.events || []).map((store) => ({
              domain: store.domain,
              service: store.service,
              procedure: "event-store",
            })),
            { name: config.name, context, procedure: "view-store" },
          ];
        case "command-gateway":
          return gateway({
            routes: config.commands,
            coreIsOwn,
            callee: (command) => ({
              name: command.name,
              domain,
              service: command.service || service,
              procedure: "command",
            }),
          });
        case "fact-gateway":
          return gateway({
            routes: config.facts,
            coreIsOwn,
            callee: (fact) => ({
              name: fact.name,
              ...(domain && { domain }),
              ...(service && { service }),
              procedure: "fact",
            }),
          });
        case "view-gateway":
          return gateway({
            routes: config.views,
            coreIsOwn,
            callee: (view) => ({
              name: view.name,
              context,
              procedure: view.procedure,
            }),
          });
        default:
          return [];
      }
    })(),
    ...declared(config),
  ];
  const seen = new Set();
  return own.filter((callee) => {
    const key = JSON.stringify(
      ["name", "domain", "service", "context", "procedure"].map(
        (property) => callee[property],
      ),
    );
    return !seen.has(key) && seen.add(key);
  });
};
