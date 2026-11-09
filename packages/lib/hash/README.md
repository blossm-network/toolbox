Keccak-256 over the single canonical JSON encoding from @blossm/cononical-string. Every JSON value is encoded, including quoted strings, so true and "true" have different commitments. Buffers use their JSON representation.

`hash(value).update(next).create()` appends each value's canonical JSON bytes before digesting. It is a sequence of encoded values, not a raw byte-stream API: `hash("a").update("b")` differs from `hash("ab")`. Native crypto/KMS signing APIs retain their own raw byte-stream contracts.

For tuple commitments, hash the array of parts with `hash([part1, part2])`; incremental updates concatenate encodings without framing tuple boundaries.
