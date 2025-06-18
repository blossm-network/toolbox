const formatSchemaValue = (value, typeKey, { wrapType = true } = {}) => {
  if (typeof value != "object") {
    return wrapType ? { [typeKey]: value } : value;
  } else if (value instanceof Array) {
    return {
      [typeKey]:
        typeof value[0] == "object" &&
        value[0].type &&
        typeof value[0].type == "object"
          ? [
              formatSchemaValue(value[0], typeKey, {
                wrapType: false,
              }),
            ]
          : value,
    };
  } else if (value.type != undefined && typeof value.type != "object") {
    let formattedObj = {
      ...value,
      [typeKey]: value.type,
    };
    delete formattedObj.type;
    return formattedObj;
  } else if (value.type != undefined && value.type instanceof Array) {
    let formattedObj = {
      [typeKey]: value.type.map((e) =>
        formatSchemaValue(e, typeKey, {
          wrapType: false,
        })
      ),
    };
    delete formattedObj.type;
    return formattedObj;
  } else {
    let newSchema = {};
    for (const key in value) {
      if (key == "type" && value[key] != undefined) {
        if (value[key].type != undefined) {
          newSchema[key] = formatSchemaValue(value[key].type, typeKey, {
            wrapType: false,
          });
        } else {
          newSchema[typeKey] = value[key];
          wrapType = false;
        }
      } else {
        newSchema[key] = value[key];
      }
    }
    return wrapType
      ? {
          [typeKey]: newSchema,
        }
      : newSchema;
  }
};

const removeIds = ({ schema, typeKey, subdocumentsOnly = true }) => {
  const newSchema = {
    ...schema,
  };
  for (const property in schema) {
    if (typeof schema[property] == "object") {
      if (schema[property][typeKey] == undefined) {
        for (const key in schema[property]) {
          newSchema[property][key] =
            typeof schema[property][key] == "object"
              ? removeIds({
                  schema: schema[property][key],
                  typeKey,
                  subdocumentsOnly: schema[property][key] instanceof Array,
                })
              : schema[property][key];
        }
        newSchema[property]._id = false;
      } else if (schema[property][typeKey] instanceof Array) {
        if (typeof newSchema[property][typeKey][0] != "object") {
          newSchema[property][typeKey][0] = schema[property][typeKey][0];
        } else if (schema[property][typeKey][0][typeKey] != undefined) {
          newSchema[property][typeKey][0][typeKey] =
            typeof schema[property][typeKey][0][typeKey] == "object"
              ? removeIds({
                  schema: schema[property][typeKey][0][typeKey],
                  typeKey,
                  subdocumentsOnly: false,
                })
              : schema[property][typeKey][0][typeKey];
        } else {
          newSchema[property][typeKey][0] = removeIds({
            schema: schema[property][typeKey][0],
            typeKey,
            subdocumentsOnly: false,
          });
        }
      } else if (typeof schema[property][typeKey] == "object") {
        for (const key in schema[property][typeKey]) {
          newSchema[property][typeKey][key] =
            typeof schema[property][typeKey][key] == "object"
              ? schema[property][typeKey][key] instanceof Array
                ? [
                    typeof schema[property][typeKey][key][0] == "object"
                      ? removeIds({
                          schema: schema[property][typeKey][key][0],
                          typeKey,
                          subdocumentsOnly: false,
                        })
                      : schema[property][typeKey][key][0],
                  ]
                : removeIds({
                    schema: schema[property][typeKey][key],
                    typeKey,
                    subdocumentsOnly: false,
                  })
              : schema[property][typeKey][key];
        }
        newSchema[property][typeKey]._id = false;
      } else {
        newSchema[property][typeKey] = schema[property][typeKey];
      }
    } else {
      newSchema[property] = schema[property];
    }
  }

  if (!subdocumentsOnly && schema[typeKey] == undefined) {
    newSchema._id = false;
  }

  return newSchema;
};

export default (schema, typeKey, { options } = {}) => {
  const newSchema = {};
  for (const property in schema) {
    newSchema[property] = {
      ...formatSchemaValue(schema[property], typeKey),
      ...options,
    };
  }

  return removeIds({ schema: newSchema, typeKey });
};
