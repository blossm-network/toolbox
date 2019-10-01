const fs = require("fs");
const ncp = require("ncp");
const path = require("path");
const { green, red } = require("chalk");
const { promisify } = require("util");

const access = promisify(fs.access);
const copy = promisify(ncp);

module.exports = async () => {
  const targetDirectory = process.cwd();
  const templateDirectory = path.resolve(__dirname, "template");

  try {
    await access(templateDirectory, fs.constants.R_OK);
  } catch (err) {
    //eslint-disable-next-line no-console
    console.error("%s Invalid template name", red.bold("ERROR"));
    process.exit(1);
  }

  await copy(templateDirectory, targetDirectory, { clobber: false });

  //eslint-disable-next-line no-console
  console.log("%s View store initialized", green.bold("DONE"));

  return true;
};
