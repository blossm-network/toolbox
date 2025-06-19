import roboSay from "@blossm/robo-say";
import { spawnSync } from "child_process";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

const { red } = chalk;

const installDependenciesIfNeeded = async (workingDir, input) => {
  const lockFile = "yarn.lock";

  const lock = path.resolve(workingDir, lockFile);

  if (fs.existsSync(lock)) return;

  const spawnInstall = spawnSync("yarn", {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir,
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

  await fs.copy(path.resolve(workingDir, modules), modulesPath);
};

export default async ({ workingDir, input }) => {
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

  if (fs.existsSync(path.resolve(workingDir, "base_test/unit"))) {
    const spawnBaseTest = spawnSync("yarn", ["test:base-unit"], {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir,
    });

    if (spawnBaseTest.stderr) {
      process.exitCode = 1;
      throw "Tests failed";
    }
  }

  if (fs.existsSync(path.resolve(workingDir, "test/unit"))) {
    const spawnTest = spawnSync("yarn", ["test:unit"], {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir,
    });

    if (spawnTest.stderr) {
      process.exitCode = 1;
      throw "Tests failed";
    }
  }
};
