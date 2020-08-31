const validator = require("@blossm/validator");

const config = require("./config.json");

const validateObject = ({ object, expectation, path, context }) => {
  console.log({ expectation });
  for (const property in expectation) {
    console.log({ property, ex: expectation[property] });
    if (
      typeof expectation[property] == "string" ||
      expectation[property] instanceof Array
    ) {
      expectation[property] = {
        type: expectation[property],
      };
    }

    if (expectation[property].type instanceof Array) {
      console.log(1);
      const error = validator.findError([
        validator[
          `${
            typeof expectation[property].type[0] == "object"
              ? expectation[property].type[0].type
                ? expectation[property].type[0].type.toLowerCase()
                : "object"
              : expectation[property].type[0].toLowerCase()
          }Array`
        ](object[property], {
          title: expectation[property].title || property,
          path: `${path}.${property}`,
          optional:
            expectation[property].optional ||
            expectation[property].default != undefined,
        }),
      ]);
      if (error) throw error;

      console.log(2);
      for (const item of object[property]) {
        console.log({ item });
        if (typeof item == "object") {
          console.log(3);
          validateObject({
            object: item,
            expectation: expectation[property].type[0],
            path: `${path}.${property}`,
            ...(context && { context }),
          });
        } else {
          console.log({ blah: expectation[property].type });
          validator[
            typeof expectation[property].type[0] != "object"
              ? expectation[property].type[0]
              : expectation[property].type[0].type
              ? expectation[property].type[0].type.toLowerCase()
              : "object"
          ](item, {
            title: `${expectation[property].type[0].title || property} item`,
            path: `${path}.${property}`,
            optional: expectation[property].type[0].optional,
            ...((expectation[property].type[0].in ||
              expectation[property].type[0].is) && {
              fn: (value) => {
                console.log({ value });
                if (typeof expectation[property].type[0] != "object")
                  return true;
                if (expectation[property].type[0].is) {
                  return expectation[property].type[0].is == "$network" &&
                    context
                    ? value == context.network
                    : value == expectation[property].type[0].is;
                }
                if (expectation[property].type[0].in) {
                  if (value instanceof Array) {
                    for (const item of value)
                      if (!expectation[property].type[0].in.includes(item))
                        return false;
                    return true;
                  } else {
                    return expectation[property].type[0].in.includes(value);
                  }
                }
              },
            }),
          });
        }
      }

      continue;
    }

    const error = validator.findError([
      validator[expectation[property].type || "object"](object[property], {
        title: expectation[property].title || property,
        path: `${path}.${property}`,
        ...((expectation[property].in || expectation[property].is) && {
          fn: (value) => {
            console.log({ value2: value });
            if (expectation[property].is) {
              return expectation[property].is == "$network" && context
                ? value == context.network
                : value == expectation[property].is;
            }
            if (expectation[property].in) {
              if (value instanceof Array) {
                for (const item of value)
                  if (!expectation[property].in.includes(item)) return false;
                return true;
              } else {
                return expectation[property].in.includes(value);
              }
            }
          },
        }),
        optional:
          expectation[property].optional ||
          expectation[property].default != undefined,
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
