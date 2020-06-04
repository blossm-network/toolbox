const validator = require("@blossm/validator");

const config = require("./config.json");

const validateObject = ({ object, expectation, path, aud }) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ expectation, aud });
  for (const property in expectation) {
    //TODO
    //eslint-disable-next-line no-console
    console.log({ property, value: expectation[property] });
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
        //TODO
        //eslint-disable-next-line no-console
        console.log({ item });
        if (typeof item == "object") {
          validateObject({
            object: item,
            expectation: expectation[property].type[0],
            path: `${path}.${property}`,
            ...(aud && { aud }),
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

    //TODO
    //eslint-disable-next-line no-console
    console.log({
      property,
      type: expectation[property].type,
      object,
      objProp: object[property],
      in: expectation[property].in,
    });
    const error = validator.findError([
      validator[expectation[property].type || "object"](object[property], {
        title: expectation[property].title || property,
        path: `${path}.${property}`,
        ...(expectation[property].in && {
          fn: (value) => {
            //TODO
            //eslint-disable-next-line no-console
            console.log("yep: ", {
              in: expectation[property].in,
              aud,
              value,
            });
            if (expectation[property].in == "$aud") {
              if (!aud) return false;
              return aud.split(",").includes(value);
            } else {
              return expectation[property].in.includes(value);
            }
          },
        }),
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
        ...(aud && { aud }),
      });
    }
    if (!expectation[property].type) {
      validateObject({
        object: object[property],
        expectation: expectation[property],
        path: `${path}.${property}`,
        ...(aud && { aud }),
      });
    }
  }
};

module.exports = async (payload, { aud } = {}) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ payload, aud });
  return validateObject({
    object: payload,
    expectation: config.payload,
    path: "payload",
    ...(aud != undefined && { aud }),
  });
};
