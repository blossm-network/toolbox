Converts JSON to CSV using json2csv field definitions.

`jsonToCsv({ data, fields })` preserves raw values for machine consumers.
Pass `spreadsheetSafe: true` for downloads intended to be opened in a spreadsheet.
This prefixes formula-leading string cells and headers with an apostrophe before
CSV quoting, including leading whitespace/control-character cases. Actual numeric
values remain numeric, and field paths/value functions retain json2csv behavior.
The resulting text values include the protective apostrophe for CSV parsers.
