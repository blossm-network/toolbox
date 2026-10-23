An event store server.

Transactions are stored as opaque objects so signed/hashed claims and trace
metadata retain their original types and fields. The command/authentication
owners validate their meaning; persistence must not cast NumericDate claims to
Strings or discard custom claims after the transaction hash is calculated.
This applies to future writes. Existing events keep their recorded hashes and
stored transaction representation; this change does not rehash or rewrite history.
