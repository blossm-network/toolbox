const { spawnSync } = require("child_process");

module.exports = async workingDir => {
  spawnSync("yarn", ["test:unit"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });
};
