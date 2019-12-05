const normalize = require("@blossm/normalize-cli");
const rootDir = require("@blossm/cli-root-dir");
const { prompt } = require("inquirer");
const roboSay = require("@blossm/robo-say");

module.exports = async args => {
  const input = await normalize({
    entrypointType: "provider",
    choices: ["mongodb"],
    args,
    flags: [
      {
        name: "user",
        short: "u",
        type: String
      },
      {
        name: "host",
        short: "h",
        type: String
      },
      {
        name: "protocol",
        short: "p",
        type: String
      }
    ]
  });

  if (!input.user) {
    const { user } = await prompt({
      type: "string",
      name: "user",
      message: roboSay(
        `What's the root name of accessing user? (Blossm will assume the full user's name is \`{root}-{NODE_ENV}\`, where NODE_ENV is either "production", "sandbox", or "staging".)`
      )
    });
    input.project = user;
  }
  if (!input.host) {
    //-ggjlv.gcp.mongodb.net
    const { host } = await prompt({
      type: "string",
      name: "host",
      message: roboSay(
        `What's the name of the host to connect to? (Blossm will assume the full host's name is \`{NODE_ENV}-{name}\`, where NODE_ENV is either "production", "sandbox", or "staging".)`
      )
    });
    input.host = host;
  }
  if (!input.protocol) {
    const { protocol } = await prompt({
      type: "list",
      name: "protocol",
      choices: ["mongodb+srv"],
      message: roboSay(`What's the connect protocol?`)
    });
    input.protocol = protocol;
  }

  rootDir.saveConfig({
    providers: {
      eventStore: {
        mongodb: {
          ...(input.user && { user: input.user }),
          ...(input.host && { password: input.host }),
          ...(input.protocol && { database: input.protocol })
        }
      }
    }
  });
};
