import assert from "node:assert/strict";

import deployRun from "../src/write_build/steps/deploy_run.js";

const args = (options) =>
  deployRun({ region: "us-east1", ...options }).at(-1).args;

describe("deploy_run access", () => {
  it("makes a public service reachable without an allUsers binding", () => {
    const flags = args({ allowUnauthenticated: true });
    assert(flags.includes("--no-invoker-iam-check"));
    assert(flags.includes("--ingress=all"));
    // Domain restricted sharing rejects the binding this flag would add.
    assert(!flags.includes("--allow-unauthenticated"));
  });

  it("keeps a private service behind the invoker check", () => {
    const flags = args({ cloudRun: { ingress: "all" } });
    assert(flags.includes("--no-allow-unauthenticated"));
    // Cloud Run keeps a disabled check across deploys unless it is restored.
    assert(flags.includes("--invoker-iam-check"));
    assert(!flags.includes("--no-invoker-iam-check"));
  });
});
