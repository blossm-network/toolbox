const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const normalizeCommand = require("../");
const deps = require("../deps");

describe("Normalize command", () => {
  afterEach(() => {
    restore();
  });
  it("should get called with expected params", async () => {
    const commandInstanceId = "commandInstanceId!";
    const sourceCommandName = "command!";

    const info = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service"
    };
    replace(deps, "commandInfoFromBody", fake.returns(info));

    const body = {
      commandInstanceId,
      sourceCommandName
    };

    await normalizeCommand(body);

    expect(body).to.deep.equal({
      commandInstanceId,
      sourceCommandName,
      action: info.action,
      domain: info.domain,
      service: info.service,
      sourceCommandAction: info.action,
      sourceCommandDomain: info.domain,
      sourceCommandService: info.service
    });
  });
  it("should get called with expected params and passed in command", async () => {
    const commandInstanceId = "commandInstanceId!";
    const info = {
      action: "some-action",
      domain: "some-domain",
      service: "some-service"
    };
    replace(deps, "commandInfoFromBody", fake.returns(info));

    const sourceCommandAction = "action!";
    const sourceCommandService = "service!";
    const sourceCommandDomain = "domain!";

    const body = {
      sourceCommandAction,
      sourceCommandDomain,
      sourceCommandService,
      commandInstanceId
    };

    await normalizeCommand(body);

    expect(body).to.deep.equal({
      commandInstanceId,
      sourceCommandAction,
      sourceCommandDomain,
      sourceCommandService,
      action: info.action,
      domain: info.domain,
      service: info.service
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
      commandInstanceId: newNonce,
      sourceCommandAction: info.action,
      sourceCommandDomain: info.domain,
      sourceCommandService: info.service,
      action: info.action,
      domain: info.domain,
      service: info.service
    });
  });
});
