const { expect } = require("chai");
const channelName = require("..");

const name = "some-name";
const contextRoot = "some-context-root";
const contextDomain = "some-context-domain";
const contextService = "some-context-service";
const contextNetwork = "some-context-network";
const principalRoot = "some-principal-root";
const principalService = "some-principal-service";
const principalNetwork = "some-principal-network";

describe("Channel name", () => {
  it("should return the correct result", () => {
    const result = channelName({
      name,
      context: {
        root: contextRoot,
        domain: contextDomain,
        service: contextService,
        network: contextNetwork,
      },
      principal: {
        root: principalRoot,
        service: principalService,
        network: principalNetwork,
      },
      keys: ["a", "b"],
    });
    expect(result).to.equal(
      "some-name.some-context-root.some-context-domain.some-context-service.some-context-network.a.b.some-principal-root.some-principal-service.some-principal-network"
    );
  });
  it("should return the correct result with optionals omitted", () => {
    const result = channelName({
      name,
    });
    expect(result).to.equal("some-name");
  });
});
