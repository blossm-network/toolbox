const normalize = require("@sustainers/normalize-cli");
const roboSay = require("@sustainers/robo-say");
const mergeCliTemplate = require("@sustainers/merge-cli-template");
const deployCliTemplate = require("@sustainers/deploy-cli-template");
const fs = require("fs-extra");
const path = require("path");
const { green } = require("chalk");

module.exports = async args => {
  //eslint-disable-next-line no-console
  console.log(roboSay("Got it, you want me to deploy an event store. On it."));
  //eslint-disable-next-line no-console
  console.log(
    roboSay(
      "It might take 5 minutes or so, maybe 4 on a good day. Either way that's still practically magic."
    )
  );

  const input = await normalize({
    entrypointType: "path",
    args,
    flags: [
      {
        name: "env",
        type: String,
        short: "e",
        default: "staging"
      }
    ]
  });

  const workingDir = path.resolve(__dirname, "tmp");

  fs.mkdirSync(workingDir);
  await mergeCliTemplate(__dirname, workingDir);
  await deployCliTemplate(workingDir, input.env);
  fs.removeSync(workingDir);

  //eslint-disable-next-line no-console
  console.log(roboSay("Done, no problem"), green.bold("perfect"));
  //eslint-disable-next-line no-console
  console.log(
    roboSay(
      "Congrats again on a new event store, my writer boss want's me to convey to you legitimate stoke. An event store is a big move!"
    )
  );
  //eslint-disable-next-line no-console
  console.log(roboSay("I'll be here whenever you need me next."));
};
