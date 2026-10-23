Schedules a job.

`create` sends its `data` as JSON with application/json Content-Type.
For Cloud Run HTTP targets, pass the native SDK `oidcToken` configuration
(`serviceAccountEmail` and optional `audience`). Keep URL query parameters out
of an explicitly supplied audience. The existing `token` argument accepts an
OAuthToken configuration object (`serviceAccountEmail`, optional `scope`) for
Google API targets; it is not a raw bearer token string. Supply one auth mode.
