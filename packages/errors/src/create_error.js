import toJSON from "./to_json.js";
import { publicInfo } from "./public_error.js";

export default (ErrorType, message, { cause, info } = {}) => {
  const error = new ErrorType({ cause, info, toJSON }, message);
  publicInfo.set(error, info === undefined ? {} : info);
  return error;
};
