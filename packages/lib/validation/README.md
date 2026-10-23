Tools to validate common types.

Each exported validator accepts an object containing `value`, optional `title`
and `path`, and optional `refinementFn`, `baseMessageFn` and
`refinementMessageFn`. The function validator is exported as `fn`.

`refinementFn` is synchronous. Return `false` or throw to reject a value;
returning null or undefined without throwing accepts the value. The option is named
`refinementFn`, not `fn`. Array refinements receive the entire validated array.
`optional: true` accepts null and undefined. Results expose `isValid()` and
`errors`; callers can combine them with `@blossm/validator.findError`.
