A view store server GET handler for streaming view ids.

This is an internal enumeration endpoint. A request without context intentionally
enumerates across contexts for administrative projection/replay work. It does
not enforce principal/group authorization and must not be exposed as a public
read API. Supplied context is scoped using the store's configured context name.
