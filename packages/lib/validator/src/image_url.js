const findError = require("./find_error");
const string = require("./string");
const isImageUrl = require("is-image-url");

module.exports = (url, { optional, title = "image", path } = {}) => {
  const err = findError([
    string(url, { fn: (url) => isImageUrl(url), optional, title, path }),
  ]);

  if (err) return err;
};
