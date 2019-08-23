const deps = require("./deps");

module.exports = async body => {
  const id = deps.nonce();
  body.id = id;

  //prevent crashing if body.sourceCommand is undefined;
  body.sourceCommand = body.sourceCommand || {};

  body.sourceCommand = {
    id: body.sourceCommand.id || id,
    action: body.sourceCommand.action || body.action,
    domain: body.sourceCommand.domain || body.domain,
    service: body.sourceCommand.service || body.service
  };
};
