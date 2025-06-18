import findError from "./find_error.js";
import string from "./string.js";
import isImageUrl from "is-image-url";

export default (url, { optional, title = "image", path } = {}) => {
  const err = findError([
    string(url, { fn: (url) => isImageUrl(url), optional, title, path }),
  ]);

  if (err) return err;
};
