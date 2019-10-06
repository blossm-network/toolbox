module.exports = (string, length, { ellipsis = "" } = {}) =>
  string.length > length
    ? `${string.substring(0, length - ellipsis.length)}${ellipsis}`
    : string;
