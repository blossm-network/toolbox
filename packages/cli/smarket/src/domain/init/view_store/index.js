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
  console.log(roboSay("Got it, you want me to initialize a view store code."));
  //eslint-disable-next-line no-console
  console.log(roboSay("I should have this ready in no time."));

  const targetDirectory = process.cwd();
  const templateDirectory = path.resolve(__dirname, "template");

  try {
    await access(templateDirectory, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        "Something is not working in my insides, I can't seem to find my own view store template! Reach out to bugs@sustainers.market please, it's in everyone's best interest.",
        red.bold("shucks")
      )
    );
    process.exit(1);
  }

  await copy(templateDirectory, targetDirectory, { clobber: false });

  //eslint-disable-next-line no-console
  console.log(roboSay("Gottem'"), green.bold("perfect"));
  //eslint-disable-next-line no-console
  console.log(
    roboSay("I hope you enjoy making this view store, sounds like fun.")
  );
  //eslint-disable-next-line no-console
  console.log(
    roboSay("Hit me up when you wanna deploy --> command view-store deploy .")
  );
  //eslint-disable-next-line no-console
  console.log(roboSay("Hasta luego"));

  return true;
};
