import { Parser } from "@json2csv/plainjs";
import { string as stringFormatter } from "@json2csv/formatters";

const quoteString = stringFormatter();
const spreadsheetString = (value) => {
  // Spreadsheet importers may ignore leading whitespace and control characters.
  // eslint-disable-next-line no-control-regex
  const formula = /^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/.test(value);
  return quoteString(formula ? `'${value}` : value);
};

export default ({ data, fields, spreadsheetSafe = false }) =>
  new Parser({
    fields,
    ...(spreadsheetSafe && { formatters: { string: spreadsheetString } }),
  }).parse(data);
