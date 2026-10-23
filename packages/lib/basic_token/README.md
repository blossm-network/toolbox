Creates a Basic authentication value from `{ root, secret }`, returning
`{ token, type: "Basic" }`. The token is base64-encoded UTF-8 `root:secret`.
It does not open a connection or encrypt the credentials.
