An event store server POST handler.

Set `returnOutcomes: true` in the POST body to receive HTTP 200 with
`{ outcomes: ["committed", "duplicate", ...] }`, one status per input entry in
input order. `committed` is returned only after the store transaction and the
existing publication step succeed; `duplicate` means the entry was filtered by
the existing durable/in-batch idempotency checks. A skipped entry does not check
its supplied event number. Number/unique conflicts from concurrent check misses
still fail normally. Without the option, successful requests retain HTTP 204.

Outcomes describe this submission, not historical callback execution or a saved
command response. Commit can precede a publication/HTTP failure; ordinary
outcomes do not close that recovery window or provide cross-store atomicity.
