const { InternalServerError } = require("restify-errors");
// const { stripIndents } = require("common-tags");

module.exports = {
  message: message => new InternalServerError(message)
};
