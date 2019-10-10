const roboSay = require("@sustainers/robo-say");
const normalize = require("@sustainers/normalize-cli");
const fs = require("fs");
const ncp = require("ncp");
const path = require("path");
const { green, red } = require("chalk");
const { promisify } = require("util");

const access = promisify(fs.access);
const copy = promisify(ncp);

module.exports = ({ domain, dir }) => async args => {
  //eslint-disable-next-line no-console
  console.log(roboSay(`Initializing your ${domain} codebase...`));

  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: domain,
    args
  });

  const targetDirectory = path.resolve(process.cwd(), input.path);
  if (!fs.existsSync(targetDirectory)) fs.mkdirSync(targetDirectory);
  const templateDirectory = path.resolve(dir, "template");

  try {
    await access(templateDirectory, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        `Your ${domain} template is unreachable. Reach out to bugs@sustainers.market please, it's in everyone's best interest.`,
        red.bold("internal error")
      )
    );
    process.exit(1);
  }

  await copy(templateDirectory, targetDirectory, { clobber: true });

  //eslint-disable-next-line no-console
  console.log(roboSay("Woohoo!"), green.bold("done"));
  //eslint-disable-next-line no-console
  console.log(roboSay("When you wanna deploy, type `blossom deploy`"));

  return true;
};
