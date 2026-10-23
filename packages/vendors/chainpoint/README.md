Anchors a hash to a blockchain.

`submitHash(hash)` returns proof handles. `getProof({ id, uri })` retrieves a
provider response for that handle and returns its proof and `anchorsComplete`
metadata. Retrieval checks the returned handle identity; it does not establish
that the proof is valid, independently confirm the expected original hash, or
verify an anchor against a blockchain. Consumers requiring that assurance must
perform proof verification separately before treating retrieval as attestation.

Check the [upstream client/network compatibility](https://github.com/chainpoint/chainpoint-js)
for the proof/network version being used. Unit tests do not check live gateway
availability or actual anchoring.
