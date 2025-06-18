import tcombValidation from "tcomb-validation";

import validator from "./_validator.js";

const { String: tString } = tcombValidation;

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
    baseFn: tString,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
