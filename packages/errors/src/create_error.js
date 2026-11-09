import publicError from "./public_error.js";

export default (ErrorType, message, { cause, info = {}, ...options } = {}) => {
  const error = new ErrorType({ ...options, cause, info }, message);
  error.publicInfo = info;
  error.toJSON = () => publicError(error);
  return error;
};
