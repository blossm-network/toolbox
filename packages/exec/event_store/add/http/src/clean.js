module.exports = async params => {
  for (const property in params) {
    if (property != "event" && property != "domain" && property != "service") {
      delete params[property];
    }
  }
  for (const property in params.event) {
    if (property != "context" && property != "fact" && property != "payload") {
      delete params.event[property];
    }
  }
  for (const property in params.event.fact) {
    if (
      property != "root" &&
      property != "topic" &&
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
};
