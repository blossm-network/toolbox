const { expect } = require("chai");
const channelName = require("..");

const name = "some-name";
const context = "some-context";
const contextRoot = "some-context-root";
const contextService = "some-context-service";
const contextNetwork = "some-context-network";

describe("Channel name", () => {
  it("should return the correct result", () => {
    const result = channelName({
      name,
      context,
      contextRoot,
      contextService,
      contextNetwork,
    });
    expect(result).to.equal(
      "some-name.some-context.some-context-root.some-context-service.some-context-network"
    );
  });
  it("should return the correct result with domain", () => {
    const domain = "some-domain";
    const domainRoot = "some-domain-root";
    const domainService = "some-domain-service";
    const domainNetwork = "some-domain-network";

    const result = channelName({
      name,
      domain,
      domainRoot,
      domainService,
      domainNetwork,
      context,
      contextRoot,
      contextService,
      contextNetwork,
    });
    expect(result).to.equal(
      "some-name.some-domain.some-domain-root.some-domain-service.some-domain-network.some-context.some-context-root.some-context-service.some-context-network"
    );
  });
});
