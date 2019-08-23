const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const normalizeCommand = require("../");
const deps = require("../deps");

describe("Normalize command", () => {
  afterEach(() => {
    restore();
  });
  it("should get called with expected params", async () => {
    const newNonce = "newNonce!";
    replace(deps, "nonce", fake.returns(newNonce));

    const params = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service"
    };

    await normalizeCommand(params);

    expect(params).to.deep.equal({
      ...params,
      id: newNonce,
      sourceCommand: {
        id: newNonce,
        action: params.action,
        domain: params.domain,
        service: params.service
      }
    });
  });
  it("should get called with expected params and passed in command", async () => {
    const newNonce = "newNonce!";
    replace(deps, "nonce", fake.returns(newNonce));
    const sourceCommandId = "command-id!";
    const sourceCommandAction = "command-action!";
    const sourceCommandDomain = "command-domain!";
    const sourceCommandService = "command-service!";

    const params = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service",
      sourceCommand: {
        action: sourceCommandAction,
        domain: sourceCommandDomain,
        service: sourceCommandService,
        id: sourceCommandId
      }
    };

    await normalizeCommand(params);

    expect(params).to.deep.equal({
      ...params,
      id: newNonce
    });
  });
  it("should get called with expected params", async () => {
    const newNonce = "newNonce!";
    replace(deps, "nonce", fake.returns(newNonce));

    const params = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service"
    };

    await normalizeCommand(params);

    expect(params).to.deep.equal({
      ...params,
      id: newNonce,
      sourceCommand: {
        id: newNonce,
        action: params.action,
        domain: params.domain,
        service: params.service
      }
    });
  });
});
