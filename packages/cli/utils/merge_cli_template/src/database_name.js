// Match deployed event-store and view-store database names in every environment.
export default ({ procedure, service, domain, context, name }) => {
  switch (procedure) {
    case "event-store":
      return `${service}_${domain}`;
    case "view-store":
      return `${context ? `${context}_` : ""}${name}`;
  }
};
