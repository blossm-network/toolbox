Returns a cryptographically random integer in `[min, max)` using Node's
`crypto.randomInt`. Returns null when min is at least max. Nonempty bounds must
be safe integers with a difference below 2^48, as required by Node's API.
