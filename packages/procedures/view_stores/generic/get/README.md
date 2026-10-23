A view store server GET handler.

List reads, including CSV downloads, default to 50 rows and accept a limit from
1 through 100. Skip must be a nonnegative safe integer. Invalid pagination is a
bad request; it is not silently truncated or interpreted as an unlimited read.
Follow the returned next link to retrieve subsequent pages.
