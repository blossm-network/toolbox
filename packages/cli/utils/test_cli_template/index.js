import roboSay from "@blossm/robo-say";
import { execFileSync } from "child_process";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

const { red } = chalk;

const installDependenciesIfNeeded = async (workingDir, input) => {
  const lockFile = "yarn.lock";

  const lock = path.resolve(workingDir, lockFile);

  if (fs.existsSync(lock)) return;

  execFileSync("yarn", [], {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd: workingDir,
  });


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
    throw err;
  }

  if (fs.existsSync(path.resolve(workingDir, "base_test/unit"))) {
    execFileSync("yarn", ["test:base-unit"], {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir,
    });

  }

  if (fs.existsSync(path.resolve(workingDir, "test/unit"))) {
    execFileSync("yarn", ["test:unit"], {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: workingDir,
    });

  }
};
