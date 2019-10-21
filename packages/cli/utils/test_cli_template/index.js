const roboSay = require("@sustainers/robo-say");
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { red } = require("chalk");

const installDependenciesIfNeeded = (workingDir, input) => {
  const lockFile = "yarn.lock";

  const srcDir = path.resolve(process.cwd(), input.path);
  const lock = path.resolve(workingDir, lockFile);

  console.log("srcDir: ", srcDir);
  console.log("lock: ", lock);
  try {
    if (fs.existsSync(lock)) {
      console.log("exists");
      return;
    }
    console.log("does not exists");

    const spawnInstall = spawnSync("yarn", ["install"], {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir
    });

    console.log("spawn is: ", spawnInstall);
    if (spawnInstall.stderr) process.exitCode = 1;

    console.log("hm");
    const newLock = path.resolve(workingDir, lockFile);
    const destination = path.resolve(srcDir, lockFile);
    console.log("new lock: ", newLock);
    fs.copyFileSync(newLock, destination);
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
