const config = require("./config.json");

const fillPayload = ({ payload, schema }) => {
  const newPayload = { ...payload };
  for (const property in schema) {
    if (newPayload[property] != undefined) {
      continue;
    } else if (schema[property].default != undefined) {
      newPayload[property] = schema[property].default;
    } else if (
      typeof schema[property] == "object" &&
      !(schema[property] instanceof Array) &&
      (schema[property].type == "object" || schema[property].type == undefined)
    ) {
      newPayload[property] = fillPayload({
        payload: newPayload[property],
        schema:
          schema[property].type == "object"
            ? schema[property].properties
            : schema[property],
      });
    }
  }
  return newPayload;
};

module.exports = async (payload) =>
  fillPayload({ payload, schema: config.payload });
