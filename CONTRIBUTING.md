# Tests and releases

Use the supported Node runtime selected by `.nvmrc` and Yarn Classic 1.22.22.
The root `packageManager` and committed `yarn.lock` record the workspace tool
and dependency resolution. `yarn install --frozen-lockfile` installs and links
workspace packages. `yarn bootstrap` is an alias for that installation; modern
Lerna delegates package installation and linking to the package manager.

## Verification

```sh
yarn runtime:check
yarn lint
yarn test
```

`yarn workspace:check` also verifies every internal range selects its local source;
registry fallback cannot silently replace a reviewed workspace package.
`yarn check-packages` runs runtime, workspace, lint and test checks. Tests include root tooling regressions and
package scripts through Lerna, with two packages running concurrently. Test
results are not cached. A successful placeholder script is not test coverage.
Root tooling checks prove that Lerna propagates a package failure even when
`--no-bail` allows other packages to finish.

For a focused package run:

```sh
yarn lerna run test --scope @blossm/mongodb-database --stream --concurrency 2
```

For a temporary exclusion while a package is explicitly deferred:

```sh
yarn lerna run test --ignore @blossm/relayr --stream --concurrency 2
```

The default modern Lerna runner uses the workspace package manager. Its legacy
`--npm-client` override is unsupported by the Nx runner. For direct execution,
the installed entrypoint is `node node_modules/lerna/dist/cli.js`. Keep Node's
selected `bin` directory on PATH so package subprocesses use the same runtime.

`yarn format` applies Prettier formatting. Lint is read-only; the pre-commit hook
uses lint-staged for changed JavaScript and Prettier for JSON. CI can set
`HUSKY=0` to skip installing local Git hooks. Do not bypass failed tests or
replace a meaningful failure with an exit-zero placeholder.

## Dependency and runtime updates

Update the owning manifest deliberately, run `yarn install` to resolve and
review `yarn.lock`, then verify a frozen install and the affected tests. A
patched direct dependency does not guarantee that nested older copies are gone;
inspect the final graph. Test consumers outside workspace hoisting when imports
or published package contracts change. `yarn test:consumer` explicitly packs and
installs the Dwolla/errors adapters outside workspace hoisting, with isolated
public-registry configuration and lifecycle scripts disabled. It uses networking
and is separate from ordinary offline tests.

Runtime images and Node versions have one owner at
`packages/cli/utils/merge_cli_template/runtime.js`. After reviewing official image
versions and digests, `yarn runtime:sync` updates the checked engine, Dockerfile,
CI and `.nvmrc` copies; `yarn runtime:check` rejects drift.

## Versions and publishing

Release commands remain explicit:

```sh
yarn patch
yarn minor
yarn major
yarn lerna-publish
```

Lerna versions packages independently and permits versioning on `master`.
Root version hooks run tests, update the changelog and push. These commands can
modify versions, tags and remote Git state; they are not verification commands.
`lerna-publish` invokes `lerna publish -y from-package`, publishing versions not
yet on the registry. It does not bump versions or provide test filtering.

Only publish with release authorization after reviewing exactly which package
names, versions and packed files are selected. Use a clean checkout containing
only approved packages: untracked workspace manifests can be discovered too.
Keep deferred WIP outside that checkout. Verify npm identity, organization
access, registry and account 2FA before starting. Do not place tokens in source,
command arguments, documentation or captured logs. If modern npm needs browser
approval, complete that existing authorization flow rather than disabling 2FA.

After publication, verify the exact version, `latest` tag and downloaded tarball
integrity/content against tested source. Registry processing can be delayed; a
temporary 404 is not a reason to publish a second time. CI verification must not
silently serve as release authorization.
