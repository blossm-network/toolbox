const deps = require("./deps");

module.exports = async body => {
  const name = deps.commandNameFromBody(body);
  body.name = name;
  body.sourceCommandName = body.sourceCommandName || name;
  body.commandInstanceId = body.commandInstanceId || deps.nonce();
};
