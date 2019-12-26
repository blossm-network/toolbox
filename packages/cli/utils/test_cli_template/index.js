const roboSay = require("@blossm/robo-say");
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { promisify } = require("util");
const ncp = require("ncp");
const { red } = require("chalk");

const copy = promisify(ncp);

const installDependenciesIfNeeded = async (workingDir, input) => {
  const lockFile = "package-lock.json";

  const lock = path.resolve(workingDir, lockFile);

  if (fs.existsSync(lock)) return;

  const spawnInstall = spawnSync("npm", ["install"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnInstall.stderr) {
    process.exitCode = 1;
    throw "Couldn't install packages";
  }

  const srcDir = path.resolve(process.cwd(), input.path);

  fs.copyFileSync(
    path.resolve(workingDir, lockFile),
    path.resolve(srcDir, lockFile)
  );

  const modules = "node_modules";
  path.resolve(srcDir, lockFile);
  const modulesPath = path.resolve(srcDir, modules);

  fs.removeSync(modulesPath);
  fs.mkdirSync(modulesPath);

  await copy(path.resolve(workingDir, modules), modulesPath);
};

module.exports = async ({ workingDir, input, imageName }) => {
  try {
    await installDependenciesIfNeeded(workingDir, input);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(err);
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "I couldn't install the dependencies needed to run tests. Reach out to bugs@blossm.network please, it's in everyone's best interest.",
        red.bold("internal error")
      )
    );
  }

  const spawnTest = spawnSync("yarn", ["test:unit"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnTest.stderr) {
    process.exitCode = 1;
    throw "Tests failed";
  }

  const spawnNetwork = spawnSync(
    "docker",
    ["network", "create", "cloudbuild"],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir
    }
  );

  if (spawnNetwork.stderr) {
    process.exitCode = 1;
    throw "Creating a network failed";
  }

  const spawnBuild = spawnSync("docker", ["build", "-t", `${imageName}`, "."], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnBuild.stderr) {
    process.exitCode = 1;
    throw "Build failed";
  }

  const spawnUp = spawnSync("docker-compose", ["up", "-d"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnUp.stderr) {
    process.exitCode = 1;
    throw "Up failed";
  }

  const spawnPs = spawnSync("docker-compose", ["ps"], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir
  });

  if (spawnPs.stderr) {
    process.exitCode = 1;
    throw "Logging failed";
  }

  const spawnIntegrationTest = spawnSync(
    "docker-compose",
    ["run", "main", "yarn", "test:integration"],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir
    }
  );

  if (spawnIntegrationTest.stderr) {
    process.exitCode = 1;
    throw "Integration tests failed";
  }
};
