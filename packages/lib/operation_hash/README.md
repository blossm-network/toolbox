Returns the decimal identity suffix for an ordered operation tuple. The shared
encoding hashes a JSON array of typed components, preserving component boundaries
and distinguishing undefined, null, empty strings and absent positions. CLI
deployment/Compose generation and RPC clients use this same owner and encoding.
Operation components are names/identifiers, not arbitrary objects.

The existing 32-bit string-hash digest is a naming suffix, not a cryptographic
commitment or authentication credential. Generated service names must still be
checked for inventory collisions.
