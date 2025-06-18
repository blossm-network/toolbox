import tcombValidation from "tcomb-validation";

import validator from "./_validator.js";

const { Object: tObject } = tcombValidation;

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
    baseFn: tObject,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
