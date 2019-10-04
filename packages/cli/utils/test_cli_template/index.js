const { spawnSync } = require("child_process");

module.exports = async workingDir => {
  const spawn = spawnSync("yarn", ["test:unit"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawn.stderr) process.exitCode = 1;
};
