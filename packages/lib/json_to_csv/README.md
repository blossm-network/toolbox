Converts JSON to downloadable CSV using json2csv field definitions.

String values and headers beginning with formula markers are prefixed with an
apostrophe before CSV quoting. This includes ASCII `=`, `+`, `-`, `@`, their
full-width equivalents, leading whitespace/control characters before a marker,
and leading tabs or line breaks. Extracted string values use the same formatter;
actual numeric cells remain numeric. There is no unsafe opt-in/default switch.

The apostrophe is part of the CSV text and remains visible to programmatic CSV
parsers. This limits formula interpretation on direct spreadsheet import; it is
not a guarantee across every spreadsheet application, locale or save/reopen
workflow. Verify the target spreadsheet/import settings when offering downloads.
