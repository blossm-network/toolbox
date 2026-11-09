import toJSON from "./to_json.js";
import { publicInfo } from "./public_error.js";

export default (ErrorType, message, { cause, info, ...options } = {}) => {
  const error = new ErrorType({ ...options, cause, info, toJSON }, message);
  publicInfo.set(error, info === undefined ? {} : info);
  return error;
};
