import tcombValidation from "tcomb-validation";

import validator from "./_validator.js";

const { Object: tObject } = tcombValidation;

export default ({
  value,
  refinementFn,
  baseMessageFn,
  refinementMessageFn,
  title,
  path,
  optional,
}) => {
  return validator({
    value,
    isArray: true,
    baseFn: tObject,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
