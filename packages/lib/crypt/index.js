const bcrypt = require("bcryptjs");

module.exports.hash = async (string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(string, salt, null);
};

module.exports.compare = (string, hash) => bcrypt.compare(string, hash);
