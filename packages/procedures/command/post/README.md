# Command POST handler

Runs a command's `mainFn`, submits its events, awaits an optional `thenFn`, and
then assembles the HTTP response. Event submission can mean queue acceptance;
numbered events use the existing synchronous persistence path.

`thenFn` can return response contributions explicitly:

```js
return {
  events,
  response: { receipt },
  thenFn: async () => {
    const { body } = await commandFn({
      domain: "session",
      name: "upgrade",
      payload: upgrade,
    });

    return {
      response: { context: body.context },
      tokens: body._tokens,
    };
  },
};
```

| Callback field | Behavior |
| --- | --- |
| `response` | Shallow-merge keys with the main response; callback keys win collisions. |
| `headers` | Shallow-merge keys with the main headers; callback keys win collisions. |
| `tokens` | Append to the main token array, preserving order and duplicates. |
| `revoke` | Append to the main revocation array, preserving order and duplicates. |
| `statusCode` | Override the main status when supplied, including status-only replies. |

Nested response objects are replaced as complete values, not recursively merged.
Omitted or null fields leave the main values intact. Returning undefined or null
from the callback preserves the existing behavior, including an empty 204 reply.
Callbacks that already mutate the response object or token arrays still work.
When adopting returned arrays, stop appending those same values through mutation
or they will be included twice.

Other returned fields, including `events` and `thenFn`, are ignored. Submit any
additional events explicitly through the existing `logEventsFn` path. A callback
failure propagates before the success response is sent; it cannot undo events
already submitted.

The runtime still assembles `_tokens`, `_revoke`, `_id` and `_tx` under their
existing conditions after merging the application response. At the command
gateway, token cookies are set before revocations, so revocation retains priority
when both target the same cookie.

An explicit status without a response now reaches `sendStatus(statusCode)` rather
than being replaced by 204. Express supplies its usual reason text for those
statuses; 204 still has no body.

## Release and adoption

Release `@blossm/command-post`, update `@blossm/command` to depend on that release,
and release the command server before rebuilding generated commands that use
returned callback fields. The current `^0.0.308` dependency does not accept
`0.0.309`; publishing only the POST package will not update existing servers.
Existing deployed binaries must be rebuilt or redeployed to gain the contract.
