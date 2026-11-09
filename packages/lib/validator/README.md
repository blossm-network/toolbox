Tools to validate common and custom types.

Most leaf validators accept `(value, options)`. Where a custom predicate is
supported, its synchronous option is `fn`, unlike the object-argument
`refinementFn` option in `@blossm/validation`. `numbersEqual` accepts two numbers
followed by options.
`findError(results)` combines validation results and nested Blossm errors into
one invalid-argument error, or returns null. Composite validators such as `name`
and `location` return an error directly when invalid and `undefined` on success.

Existing policies are explicit:

- `string` permits empty strings by default. Set `shouldAllowEmptyString: false`
  to require content. `optional` permits null and undefined. Maximum-length and
  nonempty constraints still apply when a custom `fn` returns null or undefined
  without throwing.
- Number ranges include both endpoints and do not require integers.
  `positiveNumber` accepts 0 through 1,000,000, `percentRange` accepts 0 through
  10,000, and `yearRange` accepts 1950 through 2100.
- Date components use zero-indexed months, one-indexed days and seconds since
  midnight. They check individual ranges, not complete calendar validity.
  Datetime conversion clamps an excessive day to the last day of that month.
- `domain` checks for a dot and any supplied custom predicate. It is not a full
  hostname parser. `imageUrl` uses the image URL library's filename heuristic,
  without fetching or inspecting the resource.
- Email validation additionally rejects the literal `.web` suffix and characters
  above U+00FF. Password validation retains its 8-to-30-character, supported
  character and letter/number/symbol rules.

These policies are application conventions, not reasons to add duplicate checks
inside internal libraries.
