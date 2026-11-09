import deps from "./deps.js";

const quoteString = deps.stringFormatter();
const spreadsheetString = (value) => {
  // Spreadsheet importers may ignore leading whitespace and control characters.
  // eslint-disable-next-line no-control-regex
  const formula =
    /^[\s\u0000-\u001f\u007f-\u009f]*[=+@\-＝＋＠－]|^[\t\r\n]/u.test(value);
  return quoteString(formula ? `'${value}` : value);
};

export default ({ data, fields }) =>
  new deps.Parser({ fields, formatters: { string: spreadsheetString } }).parse(
    data
  );
