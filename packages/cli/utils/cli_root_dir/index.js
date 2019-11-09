const { dirname } = require("path");
const findUp = require("find-up");
module.exports = async (cwd = process.cwd()) => {
  const blossomDir = await findUp(".blossm", { cwd });
  return blossomDir || dirname(blossomDir);
};
