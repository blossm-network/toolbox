const validator = require("@blossm/validator");

const config = require("./config.json");

const validateObject = ({ object, expectation, path }) => {
  for (const property in expectation) {
    if (typeof expectation[property] == "string") {
      expectation[property] = {
        type: expectation[property]
      };
    }
    const error = validator.findError([
      validator[expectation[property].type || "object"](object[property], {
        title: expectation[property].title || property,
        path: `${path}.${property}`
      })
    ]);
    if (error) throw error;
    if (expectation[property].type == "object") {
      validateObject({
        object: object[property],
        expectation: expectation[property].properties,
        path: `${path}.${property}`
      });
    }
  }
};

module.exports = async payload =>
  validateObject({
    object: payload,
    expectation: config.payload,
    path: "payload"
  });
