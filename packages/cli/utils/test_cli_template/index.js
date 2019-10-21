const roboSay = require("@sustainers/robo-say");
const { spawnSync } = require("child_process");
const path = require("path");
const { promisify } = require("util");
const ncp = require("ncp");
const fs = require("fs-extra");
const { red } = require("chalk");

const copy = promisify(ncp);

const installDependenciesIfNeeded = async (workingDir, input) => {
  const lockFile = "yarn.lock";

  const lock = path.resolve(workingDir, lockFile);

  if (fs.existsSync(lock)) return;

  const spawnInstall = spawnSync("yarn", ["install"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnInstall.stderr) process.exitCode = 1;

  const srcDir = path.resolve(process.cwd(), input.path);

  fs.copyFileSync(
    path.resolve(workingDir, lockFile),
    path.resolve(srcDir, lockFile)
  );

  const modules = "node_modules";
  const modulesPath = path.resolve(srcDir, modules);

  fs.removeSync(modulesPath);
  fs.mkdirSync(modulesPath);

  await copy(path.resolve(workingDir, modules), modulesPath);
};

module.exports = async ({ workingDir, input }) => {
  try {
    await installDependenciesIfNeeded(workingDir, input);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "I couldn't install the dependencies needed to run tests. Reach out to bugs@sustainers.market please, it's in everyone's best interest.",
        red.bold("internal error")
      )
    );
  }

  const spawnTest = spawnSync("yarn", ["test:unit"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnTest.stderr) process.exitCode = 1;
};
