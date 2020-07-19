const { expect } = require("chai");
const channelName = require("..");

const name = "some-name";
const contextRoot = "some-context-root";
const contextDomain = "some-context-domain";
const contextService = "some-context-service";
const contextNetwork = "some-context-network";

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
    });
    expect(result).to.equal(
      "some-name.some-context-root.some-context-domain.some-context-service.some-context-network"
    );
  });
});
