import tcombValidation from "tcomb-validation";

import validator from "./_validator.js";

const { Function: tFunction } = tcombValidation;

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
    isArray: true,
    baseFn: tFunction,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
