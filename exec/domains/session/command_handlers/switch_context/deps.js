const { create: createJwt } = require("@blossm/jwt");
const { sign } = require("@blossm/gcp-kms");

exports.createJwt = createJwt;
exports.sign = sign;
