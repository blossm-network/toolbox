Creates HMAC-SHA256 authentication codes. `create({ secret, message })` returns a
Promise for the 64-character hexadecimal digest. HMAC authenticates a message
with a shared secret; this package does not encrypt or decrypt messages.
