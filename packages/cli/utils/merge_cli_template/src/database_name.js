// One database per event-store or view-store destination in every environment.
export default ({ procedure, service, domain, context, name }) => {
  switch (procedure) {
    case "event-store":
      return `${service}_${domain}`;
    case "view-store":
      return `${context ? `${context}_` : ""}${name}`;
  }
};
