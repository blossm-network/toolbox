import tcombValidation from "tcomb-validation";

import validator from "./_validator.js";

const { Number: tNumber } = tcombValidation;

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
    isArray: true,
    baseFn: tNumber,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
