# Integration token fixture

`getToken({permissions, context, subject, password, email})` creates core account,
role, principal and session events, then calls the core session upgrade command.
It returns `{token}`. Run it only against a disposable integration environment:
it writes fixture entities and uses that environment's signing infrastructure.
All principal/session references point to `core`, including when the calling
procedure belongs to another service. Role state includes its network and roles
use the current `{id, subject}` contract.

`gatewayTokenOptions(route, {context, contextName, domain, service})` prepares
options for generated gateway smoke tests. It returns `undefined` for `none` and
`context` protection, maps command/fact privileges or view permission strings to
role grants, and nests the first allowed object-policy references under context.
A configured context subject also scopes the fixture role. `domain` and `service`
default to the procedure's environment variables.

A gateway can supply existing context references through `testing.context` in
its configuration. Required scenes and other referenced entities must already
exist; this helper creates authentication entities, not arbitrary domain data.
Command/fact smoke requests intentionally use empty payloads or a sample root and
may receive business validation errors. These tests establish route/protection
behavior, not successful execution of every application operation.

View channel discovery receives explicit query context and does not use Bearer
authentication. The generated suite retains successful channel requests and
checks missing configured context as 403 where discovery supports contextless
requests. It does not assume that every channel request without context is 401.
Strict routes with explicit empty permission lists deny access. The existing
contextless strict-channel behavior with truthy permissions is outside these
fixture repairs; gateway security policy is unchanged.
