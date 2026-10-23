A view store server GET handler.

List reads, including CSV downloads, default to 50 rows and accept a limit from
1 through 100. Skip must be a nonnegative safe integer. Invalid pagination is a
bad request; it is not silently truncated or interpreted as an unlimited read.
Follow the returned next link to retrieve subsequent pages.

Browser CSV downloads use the CSV formatter's spreadsheet-safe mode to keep
formula-leading string values and column names from executing as spreadsheet
formulas. Numeric values remain numeric. Programmatic raw CSV formatting remains
available through the formatter directly.
