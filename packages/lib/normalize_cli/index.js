const arg = require("arg");
const { prompt } = require("inquirer");
const { red } = require("chalk");

const camelCased = str =>
  str.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });

const parseArgs = (rawArgs, { permissive = true, flags = [] } = {}) => {
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

  return {
    ...flags.reduce((map, flag) => {
      return {
        ...map,
        [camelCased(flag.name)]: args[`--${flag.name}`] || flag.default
      };
    }, {}),
    entrypoint: args._[0],
    args: args._.slice(1)
  };
};

const validate = async ({ entrypointType, choices, options }) => {
  if (!options.entrypoint) {
    if (options.skipPrompts || !choices) {
      //eslint-disable-next-line no-console
      console.error(
        `%s A ${entrypointType} must be specified.`,
        red.bold("ERROR")
      );
      process.exit(1);
    } else {
      const answers = await prompt({
        type: "list",
        name: "entrypoint",
        message: `Please choose from which ${entrypointType} you'd like to run`,
        choices
      });

      options.entrypoint = answers.entrypoint;
    }
  } else if (choices && !choices.includes(options.entrypoint)) {
    //eslint-disable-next-line no-console
    console.error(
      `%s Invalid ${entrypointType}. Choose from [${choices.join(", ")}]`,
      red.bold("ERROR")
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

module.exports = async ({ entrypointType, choices, args, flags }) => {
  const options = await validate({
    entrypointType,
    choices,
    options: parseArgs(args, { flags })
  });
  return format(options, { entrypointType });
};
