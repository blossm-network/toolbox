A view store server GET handler.

Query values use the existing `#<integer>` and `@<date>` markers. The handler
converts them recursively before `queryFn`, including inside arrays and nested
operators such as `$in`. Unmarked strings stay strings. Parsed objects with
contiguous canonical keys `0`, `1`, etc. are treated as arrays; empty objects and
objects with keys such as `01` keep their shape.

These rules apply to parsed query values. The existing query-string encoder
omits empty containers and encodes null as an empty string; this handler cannot
restore values already lost in that transport.

List reads default to 50 rows and accept a limit from 1 through 100. Skip must
be a nonnegative safe integer. Invalid pagination returns a bad request rather
than being partially parsed or passed to persistence. Single-record and
bootstrap reads always use a limit of 1 and skip of 0. JSON list responses
include a next link when more results exist; CSV downloads return one bounded
page and require an explicit skip for later pages. The row cap does not bound
record size, database scanning or offset cost.
