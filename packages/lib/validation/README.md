Tools to validate common types.

Each exported validator accepts an object containing `value`, optional `title`
and `path`, and optional `refinementFn`, `baseMessageFn` and
`refinementMessageFn`. The function validator is exported as `fn`.

`refinementFn` is synchronous and runs after the base type check. It rejects by
returning `false` or throwing;
returning `undefined` or `null` without throwing accepts the value. Other return
values use JavaScript truthiness. The option is named
`refinementFn`, not `fn`. Array refinements receive the entire validated array.
`optional: true` accepts null and undefined. Results expose `isValid()` and
`errors`; callers can combine them with `@blossm/validator.findError`.
