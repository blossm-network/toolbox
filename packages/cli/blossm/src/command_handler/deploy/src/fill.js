const config = require("./config.json");

const fillPayload = ({ payload, schema }) => {
  for (const property in schema) {
    if (
      payload[property] == undefined &&
      schema[property].default != undefined
    ) {
      payload[property] = schema[property].default;
    }
    if (
      typeof schema[property] == "object" &&
      !(schema[property] instanceof Array)
    ) {
      fillPayload({ payload: payload[property], schema: schema[property] });
    }
  }
};

module.exports = async payload =>
  fillPayload({ payload, schema: config.payload });
