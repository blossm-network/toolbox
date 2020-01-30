const bcrypt = require("bcrypt");

const SALT_ITERATIONS = 10;

module.exports.hash = async string => {
  const salt = await bcrypt.genSalt(SALT_ITERATIONS);
  return await bcrypt.hash(string, salt, null);
};

module.exports.compare = (string, hash) => bcrypt.compare(string, hash);
