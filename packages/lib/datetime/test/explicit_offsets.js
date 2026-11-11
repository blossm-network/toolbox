import assert from "node:assert/strict";
import { localizedFormat, localizedLongDateString } from "../index.js";

it("honors fractional, small numeric and string offsets across day boundaries", () => {
  const instant = "2025-06-01T00:15:00Z";
  for (const [offset, formatted, long] of [
    [-300, "2025-05-31T19:15:00-05:00", "May 31st 2025, 7:15:00 pm"],
    [-240, "2025-05-31T20:15:00-04:00", "May 31st 2025, 8:15:00 pm"],
    [330, "2025-06-01T05:45:00+05:30", "June 1st 2025, 5:45:00 am"],
    ["+00:05", "2025-06-01T00:20:00+00:05", "June 1st 2025, 12:20:00 am"],
    [5, "2025-06-01T05:15:00+05:00", "June 1st 2025, 5:15:00 am"],
    [16, "2025-06-01T00:31:00+00:16", "June 1st 2025, 12:31:00 am"],
    [-16, "2025-05-31T23:59:00-00:16", "May 31st 2025, 11:59:00 pm"],
  ]) {
    assert.equal(localizedFormat(instant, offset), formatted);
    assert.equal(localizedLongDateString(instant, offset), long);
    assert.equal(Date.parse(formatted), Date.parse(instant));
  }
});

it("does not change a fixed UTC offset across New York daylight-saving boundaries", () => {
  for (const instant of [
    "2025-03-09T06:59:00Z",
    "2025-03-09T07:01:00Z",
    "2025-11-02T05:59:00Z",
    "2025-11-02T06:01:00Z",
  ]) {
    assert.equal(localizedFormat(instant, 0), instant);
    assert.equal(
      Date.parse(localizedFormat(instant, 330)),
      Date.parse(instant),
    );
    assert.ok(localizedFormat(instant, 330).endsWith("+05:30"));
  }
});
