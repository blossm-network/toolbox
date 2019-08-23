const deps = require("./deps");

module.exports = async body => {
  const { action, domain, service } = deps.commandInfoFromBody(body);
  const id = deps.nonce();
  body.action = action;
  body.domain = domain;
  body.service = service;
  body.id = id;

  //prevent crashing if body.sourceCommand is undefined;
  body.sourceCommand = body.sourceCommand || {};

  body.sourceCommand = {
    id: body.sourceCommand.id || id,
    action: body.sourceCommand.action || action,
    domain: body.sourceCommand.domain || domain,
    service: body.sourceCommand.service || service
  };
};
