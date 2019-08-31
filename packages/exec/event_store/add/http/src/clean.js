module.exports = async params => {
  for (const property in params.event.fact) {
    if (
      property != "root" &&
      property != "topic" &&
      property != "service" &&
      property != "version" &&
      property != "command" &&
      property != "traceId" &&
      property != "createdTimestamp"
    ) {
      delete params.event.fact[property];
    }
  }

  for (const property in params.event.fact.command) {
    if (
      property != "id" &&
      property != "action" &&
      property != "domain" &&
      property != "service" &&
      property != "issuedTimestamp"
    ) {
      delete params.event.fact.command[property];
    }
  }
  params.event.fact.command.issuedTimestamp;
};
