import tcombValidation from "tcomb-validation";

import validator from "./_validator.js";

const { Function } = tcombValidation;

export default ({
  value,
  baseMessageFn,
  refinementFn,
  refinementMessageFn,
  title,
  path,
  optional,
}) => {
  return validator({
    value,
    baseFn: Function,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
