module.exports = async body => {
  body.event.fact.version = parseInt(body.event.fact.version);
  body.event.fact.createdTimestamp = parseInt(body.event.fact.createdTimestamp);

  if (body.event.fact.commandIssuedTimestamp != undefined) {
    body.event.fact.commandIssuedTimestamp = parseInt(
      body.event.fact.commandIssuedTimestamp
    );
  }

  for (const property in body.event.fact) {
    if (
      property != "root" &&
      property != "topic" &&
      property != "service" &&
      property != "version" &&
      property != "commandInstanceId" &&
      property != "command" &&
      property != "commandIssuedTimestamp" &&
      property != "traceId" &&
      property != "createdTimestamp"
    ) {
      delete body.event.fact[property];
    }
  }
};
