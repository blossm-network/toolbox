const { create } = require("@blossm/mongodb-database");
const { root: merkleRoot } = require("@blossm/merkle-tree");

exports.db = { create };
exports.merkleRoot = merkleRoot;
