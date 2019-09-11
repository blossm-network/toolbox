// const deps = require("./deps");

// const priviledges = require("./src/priviledges");
// const validate = require("./src/validate");
// const clean = require("./src/clean");
// const version = require("./src/version");
// const main = require("./src/main");

// const permissionlessCommands = ["create.account"];

/// core.sn.network/command/create.token
module.exports = async () => {
  //{ operation, context }) => {
  // const { context } = await deps.authorize({
  //   requirements: {
  //     domain: operation,
  //     service: process.env.SERVICE,
  //     network: process.env.NETWORK
  //   },
  //   tokens,
  //   strict: false
  // });

  // await deps.cleanCommand(params);
  // await deps.validateCommand(params);

  // await deps.normalizeCommand(params);
  // const { payload, response } = await main({ params, context, signFn });
  // const event = await deps.createEvent({
  //   payload,
  //   version,
  //   traceId: params.traceId,
  //   context,
  //   command: {
  //     id: params.id,
  //     issuedTimestamp: params.issuedTimestamp,
  //     action: process.env.ACTION,
  //     domain: process.env.DOMAIN,
  //     service: process.env.SERVICE,
  //     network: process.env.NETWORK
  //   }
  // });
  // await publishEventFn(event);
  return {}; //response;
};
