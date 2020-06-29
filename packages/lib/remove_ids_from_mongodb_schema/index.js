const removeIds = ({ schema, subdocumentsOnly = true }) => {
  for (const property in schema) {
    if (
      schema[property] instanceof Array &&
      typeof schema[property][0] == "object"
    ) {
      schema[property][0] = removeIds({
        schema: schema[property][0],
        subdocumentsOnly: false,
      });
    } else if (
      typeof schema[property] == "object" &&
      schema[property].$type instanceof Array
    ) {
      schema[property].$type[0] = removeIds({
        schema: schema[property].$type[0],
        subdocumentsOnly: false,
      });
    } else if (typeof schema[property] == "object") {
      if (schema[property].$type == undefined) {
        for (const key in schema[property]) {
          schema[property][key] = removeIds({
            schema: schema[property][key],
            subdocumentsOnly: schema[property][key] instanceof Array,
          });
        }
        schema[property]._id = false;
      } else {
        for (const key in schema[property].$type) {
          schema[property].$type[key] = removeIds({
            schema: schema[property].$type[key],
            subdocumentsOnly: schema[property].$type[key] instanceof Array,
          });
        }
        schema[property].$type._id = false;
      }
    }
  }

  if (
    !subdocumentsOnly &&
    (schema.$type == undefined ||
      (typeof schema.$type == "object" && !(schema.$type instanceof Array)))
  ) {
    schema._id = false;
  }

  return schema;
};

module.exports = ({ schema }) => removeIds({ schema });
