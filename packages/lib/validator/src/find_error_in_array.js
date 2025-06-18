import findError from "./find_error.js";

export default (array, filter) =>
  findError(array.map((obj) => filter(obj))) || null;
