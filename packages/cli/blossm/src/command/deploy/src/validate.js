const validator = require("@blossm/validator");

const config = require("./config.json");

const validateObject = ({ object, expectation, path, context }) => {
  for (const property in expectation) {
    if (
      typeof expectation[property] == "string" ||
      expectation[property] instanceof Array
    ) {
      expectation[property] = {
        type: expectation[property],
      };
    }

    if (expectation[property].type instanceof Array) {
      const error = validator.findError([
        validator[
          `${
            typeof expectation[property].type[0] == "object"
              ? "object"
              : expectation[property].type[0].toLowerCase()
          }Array`
        ](object[property], {
          title: expectation[property].title || property,
          path: `${path}.${property}`,
          optional:
            expectation[property].optional || expectation[property].default,
        }),
      ]);
      if (error) throw error;

      for (const item of object[property]) {
        if (typeof item == "object") {
          validateObject({
            object: item,
            expectation: expectation[property].type[0],
            path: `${path}.${property}`,
            ...(context && { context }),
          });
        } else {
          validator[expectation[property].type[0]](item, {
            title: `${expectation[property].title || property} item`,
            path: `${path}.${property}`,
            optional: expectation[property].optional,
          });
        }
      }

      continue;
    }

    const error = validator.findError([
      validator[expectation[property].type || "object"](object[property], {
        title: expectation[property].title || property,
        path: `${path}.${property}`,
        ...(expectation[property].in ||
          (expectation[property].is && {
            fn: (value) => {
              if (expectation[property].is) {
                return expectation[property].is == "$network" && context
                  ? value == context.network
                  : value == expectation[property].is;
              }
              if (expectation[property].in) {
                return expectation[property].in.includes(value);
              }
            },
          })),
        optional:
          expectation[property].optional || expectation[property].default,
      }),
    ]);
    if (error) throw error;
    if (expectation[property].type == "object") {
      validateObject({
        object: object[property],
        expectation: expectation[property].properties,
        path: `${path}.${property}`,
        ...(context && { context }),
      });
    }
    if (!expectation[property].type) {
      validateObject({
        object: object[property],
        expectation: expectation[property],
        path: `${path}.${property}`,
        ...(context && { context }),
      });
    }
  }
};

module.exports = async (payload, { context } = {}) => {
  return validateObject({
    object: payload,
    expectation: config.payload,
    path: "payload",
    ...(context != undefined && { context }),
  });
};
