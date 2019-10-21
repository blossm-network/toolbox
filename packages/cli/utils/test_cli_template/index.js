const roboSay = require("@sustainers/robo-say");
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const { red } = require("chalk");

const ncp = require("ncp");
const copy = promisify(ncp);

const installDependenciesIfNeeded = (workingDir, input) => {
  const srcDir = path.resolve(process.cwd(), input.path);
  const lock = path.resolve(workingDir, "yarn.lock");

  console.log("srcDir: ", srcDir);
  console.log("lock: ", lock);
  try {
    if (fs.existsSync(lock)) {
      console.log("exists");
      return;
    }

    const spawnInstall = spawnSync("yarn", ["install"], {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir
    });

    if (spawnInstall.stderr) process.exitCode = 1;

    const newLock = path.resolve(workingDir, "yarn.lock");
    console.log("new lock: ", newLock);
    copy(newLock, srcDir);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "I couldn't install the dependencies needed to run tests. Reach out to bugs@sustainers.market please, it's in everyone's best interest.",
        red.bold("internal error")
      )
    );
  }
};

module.exports = async ({ workingDir, input }) => {
  installDependenciesIfNeeded(workingDir, input);

  const spawnTest = spawnSync("yarn", ["test:unit"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnTest.stderr) process.exitCode = 1;
};
