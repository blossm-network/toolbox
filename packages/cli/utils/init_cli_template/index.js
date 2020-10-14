const roboSay = require("@blossm/robo-say");
const normalize = require("@blossm/normalize-cli");
const fs = require("fs-extra");
const path = require("path");
const { green, red } = require("chalk");
const { promisify } = require("util");

const access = promisify(fs.access);

module.exports = ({ domain, dir, customActionSuggestions }) => async (args) => {
  //eslint-disable-next-line no-console
  console.log(roboSay(`Initializing your ${domain} codebase...`));

  const folderDomainName = domain.replace("-", "_");

  const input = await normalize({
    entrypointType: "path",
    entrypointDefault: folderDomainName,
    args,
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
        `Your ${domain} template is unreachable. Reach out to bugs@blossm.network please, it's in everyone's best interest.`,
        red.bold("internal error")
      )
    );
    process.exit(1);
  }

  await fs.copy(templateDirectory, targetDirectory);

  //eslint-disable-next-line no-console
  console.log(roboSay(""), green.bold("done"));
  //eslint-disable-next-line no-console
  console.log(
    roboSay(
      `What you can do now from your new ${folderDomainName} directory:
       • \`blossm deploy\`
          Attemp to deploy after running unit and integration tests remotely.

       • \`blossm deploy --dry-run\` 
          Running unit and integration tests remotely, 
          and printing the integration test logs from each server.

       • \`blossm test\` 
         Running unit tests locally.
       ${customActionSuggestions ? `${customActionSuggestions}` : ""}
       `
    )
  );

  return true;
};
