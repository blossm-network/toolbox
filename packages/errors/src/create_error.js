import toJSON from "./to_json.js";

export default (ErrorType, message, { cause, info = {}, ...options } = {}) => {
  const error = new ErrorType({ ...options, cause, info, toJSON }, message);
  error.publicInfo = info;
  return error;
};
