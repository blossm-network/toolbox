const { getProof } = require("@blossm/chainpoint");
const { resourceNotFound } = require("@blossm/errors");

exports.getProof = getProof;
exports.resourceNotFoundError = resourceNotFound;
