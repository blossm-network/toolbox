const normalize = require("@sustainers/normalize-cli");
const roboSay = require("@sustainers/robo-say");
const mergeCliTemplate = require("@sustainers/merge-cli-template");
const testCliTemplate = require("@sustainers/test-cli-template");
const deployCliTemplate = require("@sustainers/deploy-cli-template");
const fs = require("fs-extra");
const path = require("path");
const { green } = require("chalk");

module.exports = async args => {
  //eslint-disable-next-line no-console
  console.log(roboSay("Running your tests..."));

  const input = await normalize({
    entrypointType: "path",
    args,
    flags: [
      {
        name: "test-only",
        short: "t",
        type: Boolean,
        default: false
      },
      {
        name: "env",
        type: String,
        short: "e",
        default: "staging"
      }
    ]
  });

  const workingDir = path.resolve(__dirname, "tmp");

  fs.removeSync(workingDir);
  fs.mkdirSync(workingDir);
  await mergeCliTemplate({ templateDir: __dirname, workingDir, input });

  await testCliTemplate(workingDir);

  if (!input.testOnly) {
    //eslint-disable-next-line no-console
    console.log(
      roboSay(
        "Deploying your event store... It might take 5 minutes or so, maybe 4 on a good day."
      )
    );
    await deployCliTemplate(workingDir, input.env);
  }
  fs.removeSync(workingDir);

  //eslint-disable-next-line no-console
  console.log(roboSay("Woohoo!"), green.bold("done"));
};
