const { spawnSync } = require("child_process");

module.exports = async (workingDir, { shouldInstall }) => {
  if (shouldInstall) {
    const spawnInstall = spawnSync("yarn", ["install"], {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir
    });

    if (spawnInstall.stderr) process.exitCode = 1;
  }

  const spawnTest = spawnSync("yarn", ["test:unit"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnTest.stderr) process.exitCode = 1;
};
