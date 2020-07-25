const { write } = require("@blossm/mongodb-database");
const { root: merkleRoot } = require("@blossm/merkle-tree");

exports.db = { write };
exports.merkleRoot = merkleRoot;
