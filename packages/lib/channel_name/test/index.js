import { expect } from "chai";
import channelName from "../index.js";

const name = "some-name";
const network = "some.network";
const context = {
  root: "some-context-root",
  domain: "some-context-domain",
  service: "some-context-service",
  network: "context.network",
};
const principal = {
  root: "some-principal-root",
  service: "some-principal-service",
  network: "principal.network",
};

describe("Channel name", () => {
  it("should return the correct result", () => {
    expect(
      channelName({ name, network, context, principal, key: "a" }),
    ).to.equal(
      "some-name.some_network.c.some-context-root.some-context-domain.some-context-service.context_network.k.a.p.some-principal-root.some-principal-service.principal_network",
    );
  });
  it("should return the correct result with optionals omitted", () => {
    expect(channelName({ name, network })).to.equal("some-name.some_network");
    expect(channelName({ name, network, key: 5 })).to.equal(
      "some-name.some_network.k.5",
    );
    expect(channelName({ name, network: "Some.Network" })).to.equal(
      "some-name.some_network",
    );
  });
  it("should never give two owners the same name", () => {
    // A network that is the start of another network's name.
    const victim = channelName({
      name,
      network: "foo.com.au",
      context: { ...context, network: "foo.com.au" },
    });
    for (const forged of [
      { network: "foo.com", context: { ...context, root: "au" } },
      { network: "foo.com", key: "au" },
      { network: "foo.com", principal: { ...principal, root: "au" } },
    ])
      expect(channelName({ name, ...forged })).to.not.equal(victim);
    // A key and a principal are six parts, as a context is.
    expect(channelName({ name, network, key: "a", principal })).to.not.equal(
      channelName({
        name,
        network,
        context: {
          root: "a",
          domain: principal.root,
          service: principal.service,
          network: principal.network,
        },
      }),
    );
    // Every network keeps its own first two parts.
    expect(victim.startsWith(`${name}.foo_com_au.`)).to.equal(true);
    expect(
      channelName({ name, network: "foo.com", key: "au" }).startsWith(
        `${name}.foo_com.`,
      ),
    ).to.equal(true);
  });
  it("should refuse a part that could be read as more than one", () => {
    for (const parts of [
      { name: "a.b", network },
      { name, network: "some_network" },
      { name, network: "a..b" },
      { name, network: undefined },
      { name, network, key: "a.b" },
      { name, network, key: "" },
      { name, network, key: ["a"] },
      { name, network, key: { a: 1 } },
      { name, network, context: { ...context, root: "a.b" } },
      { name, network, context: { root: "a", domain: "b" } },
      { name, network, context: { ...context, network: "a/b" } },
      { name, network, principal: { ...principal, service: undefined } },
      { name: undefined, network },
    ])
      expect(() => channelName(parts)).to.throw(TypeError);
  });
});
