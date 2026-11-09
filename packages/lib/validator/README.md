Tools to validate common and custom types.


`string(value, { fn, maxLength, shouldAllowEmptyString })` accepts a synchronous
custom predicate. Returning null or undefined without throwing counts as success;
configured maximum-length and nonempty constraints still apply. Return false or
throw to reject.
