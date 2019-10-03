const roboSay = require("@sustainers/robo-say");
const fs = require("fs");
const ncp = require("ncp");
const path = require("path");
const { green, red } = require("chalk");
const { promisify } = require("util");

const access = promisify(fs.access);
const copy = promisify(ncp);

module.exports = async () => {
  //eslint-disable-next-line no-console
  console.log(roboSay("Initializing an event store codebase..."));

  const targetDirectory = process.cwd();
  const templateDirectory = path.resolve(__dirname, "template");

  try {
    await access(templateDirectory, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "The event store template is unreachable. Reach out to bugs@sustainers.market please, it's in everyone's best interest.",
        red.bold("internal error")
      )
    );
    process.exit(1);
  }

  await copy(templateDirectory, targetDirectory, { clobber: false });

  //eslint-disable-next-line no-console
  console.log(roboSay("Woohoo!"), green.bold("done"));
  //eslint-disable-next-line no-console
  console.log(
    roboSay("When you wanna deploy, type `smarket issue event-store deploy .`")
  );

  return true;
};
