Date and time functionality.

`localizedFormat(instant, offset)` and `localizedLongDateString(instant, offset)`
use the explicit UTC offset supplied to Moment's `utcOffset`, such as `-300` for
UTC-05:00 or `330` for UTC+05:30. They do not infer a location or daylight saving.
Supply the effective offset for the instant. Moment also accepts offset strings,
such as `"+00:05"`, and treats numeric offsets with an absolute value below 16 as hours.

For New York in summer, pass the effective offset `-240`, rather than the
standard-time offset `-300`.
For location-based formatting, resolve an IANA timezone using a timezone-aware
library rather than guessing a location from a numeric offset.
