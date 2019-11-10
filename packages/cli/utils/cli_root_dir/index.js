const { dirname } = require("path");
const findUp = require("find-up");
module.exports = async (cwd = process.cwd()) => {
  const blossmDir = await findUp(".blossm", { cwd });
  return blossmDir || dirname(blossmDir);
};
