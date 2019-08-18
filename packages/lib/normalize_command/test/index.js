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

    const name = "command!";
    replace(deps, "commandNameFromBody", fake.returns(name));

    const body = {
      commandInstanceId,
      sourceCommandName
    };

    await normalizeCommand(body);

    expect(body).to.deep.equal({
      commandInstanceId,
      sourceCommandName,
      name
    });
  });
  it("should get called with expected params and passed in command", async () => {
    const commandInstanceId = "commandInstanceId!";
    const name = "command!";
    replace(deps, "commandNameFromBody", fake.returns(name));

    const body = {
      commandInstanceId
    };

    await normalizeCommand(body, { name });

    expect(body).to.deep.equal({
      commandInstanceId,
      sourceCommandName: name,
      name
    });
  });
  it("should get called with expected params", async () => {
    const newNonce = "newNonce!";
    replace(deps, "nonce", fake.returns(newNonce));
    const name = "command!";
    replace(deps, "commandNameFromBody", fake.returns(name));

    const body = {};

    await normalizeCommand(body, { name });

    expect(body).to.deep.equal({
      commandInstanceId: newNonce,
      sourceCommandName: name,
      name
    });
  });
});
