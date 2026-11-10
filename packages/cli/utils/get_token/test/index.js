import { expect } from "chai";
import { replace, restore, stub } from "sinon";
import getToken, { gatewayTokenOptions } from "../index.js";
import deps from "../deps.js";

// Keep real event construction; replace only credential/store/command seams.
const create = (failure) => {
  const events = [];
  const issue = stub().resolves({
    body: { _tokens: [{ value: "access-token" }] },
  });
  const set = stub().returns({ issue });
  replace(deps, "hash", async () => "password-hash");
  replace(deps, "eventStore", ({ domain, service }) => {
    expect(service).to.equal("core");
    return {
      add: async ({ eventData }) => {
        if (failure) throw failure;
        for (const { event } of eventData) {
          expect(event.headers.domain).to.equal(domain);
          expect(event.headers.service).to.equal(service);
          events.push(event);
        }
      },
    };
  });
  const command = stub().returns({ set });
  replace(deps, "command", command);
  return { events, set, issue, command };
};

describe("Integration token fixture", () => {
  const previous = { ...process.env };
  beforeEach(() => {
    process.env.NETWORK = "fixture.network";
    process.env.SERVICE = "system";
  });
  afterEach(() => {
    restore();
    process.env = { ...previous };
  });

  it("creates core references and current principal roles even from a non-core gateway", async () => {
    const fixture = create();
    const permissions = [
      { service: "system", domain: "key", privilege: "read" },
    ];
    expect(await getToken({ permissions })).to.deep.equal({
      token: "access-token",
    });
    const event = (domain) =>
      fixture.events.find(({ headers }) => headers.domain === domain);
    const principal = {
      root: event("principal").headers.root,
      service: "core",
      network: "fixture.network",
    };
    expect(event("account").payload.principal).to.deep.equal(principal);
    expect(event("role").payload).to.include({ network: "fixture.network" });
    expect(event("role").payload.permissions).to.deep.equal(permissions);
    expect(event("principal").payload.roles).to.deep.equal([
      {
        id: event("role").payload.id,
        subject: { ...principal, domain: "principal" },
      },
    ]);
    expect(fixture.set.firstCall.args[0].context.session).to.deep.equal({
      root: event("session").headers.root,
      service: "core",
      network: "fixture.network",
    });
    expect(fixture.issue.firstCall.args[0]).to.deep.equal({ principal });
    expect(fixture.issue.firstCall.args[1]).to.deep.equal({
      root: event("session").headers.root,
    });
    expect(fixture.command.firstCall.args[0]).to.deep.equal({
      name: "upgrade",
      domain: "session",
      service: "core",
    });
  });

  it("keeps explicitly supplied context and binds a scoped permission role to its subject", async () => {
    const fixture = create();
    const node = {
      root: "node-root",
      service: "system",
      network: "fixture.network",
    };
    await getToken({ context: { node }, subject: { ...node, domain: "node" } });
    expect(fixture.set.firstCall.args[0].context.node).to.deep.equal(node);
    expect(
      fixture.events.find(({ headers }) => headers.domain === "principal")
        .payload.roles[0].subject,
    ).to.deep.equal({ ...node, domain: "node" });
  });

  it("propagates fixture creation failures before requesting a token", async () => {
    const failure = new Error("store unavailable");
    const fixture = create(failure);
    try {
      await getToken();
      expect.fail("expected rejection");
    } catch (error) {
      expect(error).to.equal(failure);
    }
    expect(fixture.command.called).to.equal(false);
  });
});

describe("Gateway token options", () => {
  it("requires tokens for default, strict and object policies only", () => {
    for (const protection of [undefined, "strict", { node: [{ root: "n" }] }])
      expect(gatewayTokenOptions({ protection })).to.be.an("object");
    for (const protection of ["none", "context"])
      expect(gatewayTokenOptions({ protection })).to.equal(undefined);
  });
  it("converts command/fact privileges and view permission strings to role grants", () => {
    const grant = { service: "system", domain: "key", privilege: "read" };
    expect(
      gatewayTokenOptions(
        { privileges: ["read"] },
        { service: "system", domain: "key" },
      ).permissions,
    ).to.deep.equal([grant]);
    expect(
      gatewayTokenOptions({ permissions: ["system:key:read"] }).permissions,
    ).to.deep.equal([grant]);
    expect(
      gatewayTokenOptions({ privileges: "none" }).permissions,
    ).to.deep.equal([]);
  });
  it("nests object-policy references and binds the grant to its configured subject", () => {
    const node = { root: "n", service: "system", network: "fixture.network" };
    expect(
      gatewayTokenOptions({ protection: { node: [node] }, context: "node" }),
    ).to.deep.equal({
      permissions: [],
      context: { node },
      subject: { ...node, domain: "node" },
    });
    expect(
      gatewayTokenOptions({}, { context: { node }, contextName: "node" })
        .subject,
    ).to.deep.equal({ ...node, domain: "node" });
  });
});
