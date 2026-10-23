A library of errors that can be thrown by the network.

`error.info()` and `error.cause()` retain internal diagnostics. `error.toJSON()`
uses the same public contract as the error middleware: status, code, message,
and allowlisted `info.errors` entries (`message` and `path`) or an authentication
`info.redirect`. Other info fields and causes are never serialized. Server errors
use a generic message and omit all info. New public error metadata needs an
explicit contract change here, rather than attaching diagnostic request objects.

Error messages and validation messages must describe the problem without echoing
credentials or submitted secrets. Request bodies, queries, parameters and raw
error objects are not included in middleware logs.
