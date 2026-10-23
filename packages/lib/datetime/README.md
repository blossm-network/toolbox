Date and time functionality.

`localizedFormat(instant, offset)` and `localizedLongDateString(instant, offset)`
use the explicit UTC offset supplied to Moment's `utcOffset`, such as `-300` for
UTC-05:00 or `330` for UTC+05:30. They do not infer a location or daylight saving.
Supply the effective offset for the instant. Moment also accepts offset strings,
such as `"+00:05"`, and treats numeric offsets between -16 and 16 as hours.

Migration: these helpers previously added New York daylight saving to every
offset. Callers that supplied a US standard offset must now resolve the effective
offset themselves, for example `-240` rather than `-300` for New York in summer.
For location-based formatting, resolve an IANA timezone using a timezone-aware
library rather than guessing a location from a numeric offset.
