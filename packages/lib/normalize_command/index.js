const deps = require("./deps");

module.exports = async params => {
  const id = deps.nonce();
  params.id = id;

  //prevent crashing if params.sourceCommand is undefined;
  params.sourceCommand = params.sourceCommand || {};

  params.sourceCommand = {
    id: params.sourceCommand.id || id,
    action: params.sourceCommand.action || params.action,
    domain: params.sourceCommand.domain || params.domain,
    service: params.sourceCommand.service || params.service
  };
};
