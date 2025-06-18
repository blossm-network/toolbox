import tcombValidation from "tcomb-validation";

import validator from "./_validator.js";

const { Boolean: tBoolean } = tcombValidation;

export default ({
  value,
  baseMessageFn,
  refinementMessageFn,
  refinementFn,
  title,
  path,
  optional,
}) => {
  return validator({
    value,
    baseFn: tBoolean,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
