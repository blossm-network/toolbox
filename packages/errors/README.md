A library of errors that can be thrown by the network.

The info passed to this package's error constructors is application-defined
public metadata. `error.toJSON()` and the
error middleware preserve its object or array unchanged, together with the
explicit error message, code and status. This includes trace/resource IDs,
conflict arrays, validation errors and authentication redirects. The middleware
also logs status, code, the public message and this declared public metadata for
audit correlation. Native error types and stack call sites are retained only in
server logs; the complete native message prefix is excluded even when multiline.
RPC logs retain operation identity, region and network without raw URLs,
forwarded context, credentials or request/response bodies.

Authors must keep public messages and info free of credentials and submitted
secrets. RPC must not attach bearer tokens, forwarded request context or raw
request payloads to public error metadata. Public info is an explicit contract,
not a container for private diagnostics.

`error.cause()` remains available internally but is never serialized. SDK info() still exposes internal diagnostics, including inherited cause info;
those inherited fields are not implicitly published. Errors constructed outside
this package are undeclared. Native error stacks, causes, arbitrary toJSON
methods and diagnostic info
properties are not public response fields. Undeclared native server errors use
a generic public message. Middleware does not log raw errors, native messages,
causes, or request bodies, queries or parameters.
