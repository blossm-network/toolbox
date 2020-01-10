const removeIds = ({ schema, subdocumentsOnly = true }) => {
  for (const property in schema) {
    if (
      schema[property] instanceof Array &&
      typeof schema[property][0] == "object"
    ) {
      schema[property][0] = removeIds({
        schema: schema[property][0],
        subdocumentsOnly: false
      });
    } else if (
      typeof schema[property] == "object" &&
      schema[property].type instanceof Array
    ) {
      schema[property].type[0] = removeIds({
        schema: schema[property].type[0],
        subdocumentsOnly: false
      });
    } else if (
      typeof schema[property] == "object" &&
      schema[property].type == undefined
    ) {
      schema[property]._id = false;
    }
  }

  if (!subdocumentsOnly) schema._id = false;
  return schema;
};

module.exports = ({ schema }) => removeIds({ schema });
