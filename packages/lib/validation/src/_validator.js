import tcombValidation from "tcomb-validation";

import process from "./_process.js";

const { refinement, list } = tcombValidation;

export default ({
  value,
  isArray,
  baseFn,
  baseMessageFn = (error, title) => {
    if (!title) return error.message;
    return `This ${title} doesn't look right.`;
  },
  refinementFn,
  refinementMessageFn,
  title,
  path,
  optional,
}) => {
  const baseThrowingMessage = (value, _, context) => {
    try {
      baseFn(value);
    } catch (e) {
      return baseMessageFn(e, context.title);
    }
  };

  baseFn.getValidationErrorMessage = baseThrowingMessage;

  const transformedBaseFn = !isArray
    ? baseFn
    : (() => {
        const arrayBaseFn = list(baseFn);
        arrayBaseFn.getValidationErrorMessage = (value, _, context) => {
          try {
            arrayBaseFn(value);
          } catch (e) {
            return baseMessageFn(e, context.title);
          }
        };
        return arrayBaseFn;
      })();

  //If the passed in function throws, return a falsey message;
  const throwingFn = !refinementFn
    ? null
    : (v) => {
        try {
          const fnValue = refinementFn(v);

          if (fnValue != undefined) return fnValue;

          //return true if the function doesn't have a return value but doesnt throw.
          return true;
        } catch (e) {
          return false;
        }
      };

  const validatorFn = !throwingFn
    ? transformedBaseFn
    : (() => {
        const refinedFn = refinement(transformedBaseFn, throwingFn);
        //If the fn throws and a message wasn't passed in, use the thrown message;
        refinedFn.getValidationErrorMessage = (value, _, context) => {
          if (refinementMessageFn) {
            const resolvedMessage = refinementMessageFn(value, title);
            if (resolvedMessage) return resolvedMessage;
          }

          try {
            refinementFn(value);
          } catch (e) {
            const isString = typeof e == "string";
            if (isString) return e;
            else if (e.message) return e.message;
            else return baseMessageFn(e, context.title);
          }
        };
        return refinedFn;
      })();

  return process(value, validatorFn, {
    context: { title },
    ...(path && { path: [path] }),
    optional,
  });
};
