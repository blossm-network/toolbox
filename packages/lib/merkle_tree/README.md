Computes a Merkle Patricia trie root from key/value pairs.

`root(pairs)` returns the root Buffer. `verify({ pairs, key, value, root })`
reconstructs the trie from the supplied pairs, creates a proof and checks it
against the supplied root. Keys are strings or Buffers; verification compares
values as UTF-8 text. The existing event/block consumers use string/JSON pairs.

Verification currently rebuilds the entire trie. Persisted proofs would be a
separate API for workloads that need verification without all pairs.
