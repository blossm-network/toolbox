Schedules a job.

`create` sends its `data` as JSON with application/json Content-Type.
The `token` argument accepts a native SDK OAuthToken configuration object
(`serviceAccountEmail` and optional `scope`) for Google API targets; it is not a
raw bearer token string.
