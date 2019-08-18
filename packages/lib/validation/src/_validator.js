const { refinement } = require("tcomb-validation");

const process = require("./_process");

module.exports = ({ value, refinementType, message, fn, optional }) => {
  if (fn == undefined) return process(value, refinementType, optional);

  //If the passed in function throws, return a falsey message;
  const throwingFn = v => {
    try {
      const fnValue = fn(v);

      if (fnValue != undefined) return fnValue;

      //return true if the function doesn't have a return value but doesnt throw.
      return true;
    } catch (e) {
      return false;
    }
  };

  //If the fn throws and a message wasn't passed in, use the thrown message;
  const throwingMessage = value => {
    if (message != undefined) return message(value);

    try {
      //Allow the fn to throw.
      fn(value);
    } catch (error) {
      const isString = typeof error == "string";

      if (isString) return error;
      else if (error.message != undefined) return error.message;
    }
  };

  const validator = refinement(refinementType, throwingFn);

  validator.getValidationErrorMessage = throwingMessage;

  return process(value, validator, optional);
};
