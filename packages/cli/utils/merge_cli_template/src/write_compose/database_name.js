// Match the database identity used by production event/view store deployments.
export default ({ procedure, service, domain, context, name }) => {
  switch (procedure) {
    case "event-store":
      return `${service}_${domain}`;
    case "view-store":
      return `${context ? `${context}_` : ""}${name}`;
  }
};
