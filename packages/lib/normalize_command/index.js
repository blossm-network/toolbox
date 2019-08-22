const deps = require("./deps");

module.exports = async body => {
  const { action, domain, service } = deps.commandInfoFromBody(body);
  body.action = action;
  body.domain = domain;
  body.service = service;
  body.sourceCommandAction = body.sourceCommandAction || action;
  body.sourceCommandDomain = body.sourceCommandDomain || domain;
  body.sourceCommandService = body.sourceCommandService || service;
  body.commandInstanceId = body.commandInstanceId || deps.nonce();
};
