const roboSay = require("@sustainers/robo-say");
const arg = require("arg");
const { prompt } = require("inquirer");
const { red } = require("chalk");

const camelCased = str =>
  str.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });

const parseArgs = (
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

  console.log("positional: ", args._.slice(1).filter(arg => arg[0] != "-"));

  return {
    ...flags.reduce((map, flag) => {
      return {
        ...map,
        [camelCased(flag.name)]: args[`--${flag.name}`] || flag.default
      };
    }, {}),
    entrypoint: args._[0] || entrypointDefault,
    args: args._.slice(1),
    positionalArgs: args._.slice(1).filter(arg => arg[0] != "-")
  };
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
    options: parseArgs(args, { flags, entrypointDefault })
  });
  return format(options, { entrypointType });
};
