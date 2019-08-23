module.exports = async body => {
  body.event.fact.version = parseInt(body.event.fact.version);
  body.event.fact.createdTimestamp = parseInt(body.event.fact.createdTimestamp);

  for (const property in body.event.fact) {
    if (
      property != "root" &&
      property != "topic" &&
      property != "service" &&
      property != "version" &&
      property != "command" &&
      property != "traceId" &&
      property != "createdTimestamp"
    ) {
      delete body.event.fact[property];
    }
  }

  for (const property in body.event.fact.command) {
    if (
      property != "id" &&
      property != "action" &&
      property != "domain" &&
      property != "service" &&
      property != "issuedTimestamp"
    ) {
      delete body.event.fact.command[property];
    }
  }
  body.event.fact.command.issuedTimestamp = parseInt(
    body.event.fact.command.issuedTimestamp
  );
};
