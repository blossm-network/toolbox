const roboSay = require("@blossm/robo-say");
const arg = require("arg");
const { prompt } = require("inquirer");
const { red } = require("chalk");

const camelCased = str =>
  str.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });
const flagValue = async (flag, args) => {
  const value = args[`--${flag.name}`] || flag.default;
  if (value) return value;

  if (flag.choices) {
    const { flagValue } = await prompt({
      type: "list",
      name: "flagValue",
      message: roboSay(
        `Which of these ${flag.name}'s do you wanna use by default?`
      ),
      choices: flag.choices
    });

    return flagValue;
  }

  if (flag.required) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        `You didn't give me a ${flag.name} flag. Add it then give it another go.`
      ),
      red.bold("error")
    );
    process.exit(1);
  }
};

const parseArgs = async (
  rawArgs,
  { permissive = true, flags = [], entrypointDefault } = {}
) => {
  const flagArgs = flags.reduce((map, flag) => {
    return {
      ...map,
      [`--${flag.name}`]: flag.type,
      [`-${flag.short}`]: `--${flag.name}`
    };
  }, {});

  try {
    const args = arg(
      {
        "--skip-prompts": Boolean,
        "-s": "--skip-prompts",
        ...flagArgs
      },
      {
        argv: rawArgs,
        permissive
      }
    );

    for (const flag of flags) flag.value = await flagValue(flag, args);

    const formattedFlags = flags.reduce((map, flag) => {
      return {
        ...map,
        [camelCased(flag.name)]: flag.value
      };
    }, {});

    return {
      ...formattedFlags,
      entrypoint: args._[0] || entrypointDefault,
      args: args._.slice(1),
      positionalArgs: args._.slice(1).filter(arg => arg[0] != "-")
    };
  } catch (e) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        `I couldn't read the command. Flags should be set like \`--flag=flagValue\`, \`--flag flagValue\`, or \`-f flagValue\``
      ),
      red.bold("error")
    );
    process.exit(1);
  }
};

const validate = async ({ entrypointType, choices, options }) => {
  if (!options.entrypoint) {
    if (options.skipPrompts || !choices) {
      //eslint-disable-next-line no-console
      console.error(
        roboSay(
          `You didn't tell me the ${entrypointType} you want. Add it then give it another go.`
        ),
        red.bold("error")
      );
      process.exit(1);
    } else {
      const answers = await prompt({
        type: "list",
        name: "entrypoint",
        message: roboSay(
          `Which of these ${entrypointType}'s do you wanna run?`
        ),
        choices
      });

      options.entrypoint = answers.entrypoint;
    }
  } else if (choices && !choices.includes(options.entrypoint)) {
    //eslint-disable-next-line no-console
    console.error(
      roboSay(
        `This ${entrypointType} isn't recognized. Choose from one of these [${choices.join(
          ", "
        )}]`
      ),
      red.bold("error")
    );
    process.exit(1);
  }

  return options;
};

const format = (options, { entrypointType } = {}) => {
  options[entrypointType] = options.entrypoint;
  delete options.entrypoint;
  return options;
};

module.exports = async ({
  entrypointType,
  entrypointDefault,
  choices,
  args,
  flags
}) => {
  const options = await validate({
    entrypointType,
    choices,
    options: await parseArgs(args, { flags, entrypointDefault })
  });
  return format(options, { entrypointType });
};
