# Toolbox development and releases

Run these commands from the Toolbox repository root with dependencies installed.
The repository uses Yarn workspaces and independently versioned Lerna packages.
Package identity comes from each `package.json`, not its directory name.

## Tests

The normal repository command is:

```sh
yarn test
```

It runs `lerna run test` across packages with a test script. To use installed
Lerna directly, collect all failures and avoid the Corepack/Yarn wrapper:

```sh
./node_modules/.bin/lerna run test --npm-client npm --no-bail --stream --concurrency 4
```

For one package:

```sh
./node_modules/.bin/lerna run test --scope @blossm/erc2771 --npm-client npm
```

Relayr is currently unfinished and explicitly deferred. Until it is completed,
exclude only that package from a broad run:

```sh
./node_modules/.bin/lerna run test --ignore @blossm/relayr --npm-client npm --no-bail --stream --concurrency 4
```

This exclusion is temporary, not a change to the default test script. The run at
`bf304d47c` passed 996 tests across 129 packages. All 147 selected package scripts
succeeded; 18 were no-test placeholders and do not establish coverage.

## Versioning

The existing commands are `yarn patch`, `yarn minor` and `yarn major`, backed by
`lerna version`. Versioning is configured for `master`. Inspect the lifecycle
hooks before running them: root scripts run tests, update/stage the changelog
and push Git changes. A version bump and a publication are separate operations.

## Publication

The existing convenience command is:

```sh
yarn lerna-publish
```

It expands to `npx lerna publish -y from-package`. It publishes current manifest
versions that are absent from npm, skips confirmation, and does not run tests
or bump versions. For an interactive release that shows the package list first:

```sh
./node_modules/.bin/lerna publish from-package
```

Before publishing:

1. Run the relevant tests and inspect Git status and the intended release set.
2. Use a clean checkout of the tested commit. This Lerna v3 publisher does not
   offer the test command's `--ignore` filter: untracked package manifests can be
   discovered too. Keep deferred Relayr out of the release checkout entirely.
3. Check `npm whoami` and `npm org ls blossm --json`. The active account needs
   permission to create/publish packages in `@blossm`; successful login alone
   does not establish that access. Complete any organization invitation.
4. Complete npm's required 2FA/browser authorization. Keep credentials, tokens,
   recovery codes and OTPs out of source, logs and chat.
5. Review the package/version list before confirming the authorized publication.

During the first EVM release, Lerna's legacy publisher could not complete npm's
current 2FA flow. If that happens, use the installed modern npm CLI from each
eligible package directory, keeping the same versions and dependency order:

```sh
npm publish --access public --registry https://registry.npmjs.org/
```

This is a fallback for the same release, not a reason to disable 2FA. Preserve
the root MIT license inclusion that Lerna normally supplies to packages without
a local license, and keep existing upstream licenses. For the initial EVM
packages, publish the ABI, provider and address packages before the signer.

An npm publish command may succeed while the registry still processes the
upload. Do not resubmit simply because it is temporarily unavailable. Verify
each exact version and `latest` tag, then download its tarball and compare
integrity and contents with the prepared release. A temporary processing
placeholder is not the requested version. The four initial EVM packages are
published at `0.0.1` from `bf304d47c`; their tarballs were verified against that
source plus the existing license files. Relayr remains unpublished.

Publish only when authorized. Publication does not authorize merging a PR or
deploying contracts or applications.
