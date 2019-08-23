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

    const info = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service"
    };
    replace(deps, "commandInfoFromBody", fake.returns(info));

    const body = {};

    await normalizeCommand(body);

    expect(body).to.deep.equal({
      id: newNonce,
      action: info.action,
      domain: info.domain,
      service: info.service,
      sourceCommand: {
        id: newNonce,
        action: info.action,
        domain: info.domain,
        service: info.service
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

    const info = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service"
    };
    replace(deps, "commandInfoFromBody", fake.returns(info));

    const body = {
      sourceCommand: {
        action: sourceCommandAction,
        domain: sourceCommandDomain,
        service: sourceCommandService,
        id: sourceCommandId
      }
    };

    await normalizeCommand(body);

    expect(body).to.deep.equal({
      id: newNonce,
      action: info.action,
      domain: info.domain,
      service: info.service,
      sourceCommand: {
        id: sourceCommandId,
        action: sourceCommandAction,
        domain: sourceCommandDomain,
        service: sourceCommandService
      }
    });
  });
  it("should get called with expected params", async () => {
    const newNonce = "newNonce!";
    replace(deps, "nonce", fake.returns(newNonce));
    const info = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service"
    };
    replace(deps, "commandInfoFromBody", fake.returns(info));

    const body = {};

    await normalizeCommand(body);

    expect(body).to.deep.equal({
      id: newNonce,
      action: info.action,
      domain: info.domain,
      service: info.service,
      sourceCommand: {
        id: newNonce,
        action: info.action,
        domain: info.domain,
        service: info.service
      }
    });
  });
});
