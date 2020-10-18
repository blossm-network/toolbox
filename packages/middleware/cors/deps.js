const { unauthorized } = require("@blossm/errors");
const cors = require("cors");
const allow = require("./src/allow");

exports.cors = cors;
exports.allow = allow;
exports.unauthorizedError = unauthorized;
