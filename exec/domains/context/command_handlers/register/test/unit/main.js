const { expect } = require("chai").use(require("sinon-chai"));
const { replace, restore, fake } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

const payload = "some-payload";
const root = "some-root";
const contextSession = "some-context-session";
const context = {
  session: contextSession
};
const session = {
  a: 1
};

describe("Command handler unit tests", () => {
  afterEach(() => {
    restore();
  });
  it("should return successfully", async () => {
    const uuid = "some-uuid";
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    const token = "some-token";
    const issueFake = fake.returns({ token });
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const result = await main({ payload, root, context, session });
    expect(result).to.deep.equal({
      events: [
        {
          domain: "principle",
          action: "add-permissions",
          root: uuid,
          payload: {
            permissions: [`context:admin:${root}`]
          }
        },
        { payload, root }
      ],
      response: {
        principle: uuid,
        token
      }
    });
    expect(commandFake).to.have.been.calledWith({
      domain: "session",
      action: "upgrade"
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      {
        principle: uuid
      },
      { root: contextSession }
    );
  });
  it("should return successfully if there's a session subject", async () => {
    const uuid = "some-uuid";
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    const token = "some-token";
    const issueFake = fake.returns({ token });
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const result = await main({
      payload,
      root,
      context,
      session: { sub: "some-sub" }
    });
    expect(result).to.deep.equal({
      events: [
        {
          domain: "principle",
          action: "add-permissions",
          root: "some-sub",
          payload: {
            permissions: [`context:admin:${root}`]
          }
        },
        { payload, root }
      ],
      response: {
        principle: "some-sub"
      }
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const uuidFake = fake.rejects(errorMessage);
    replace(deps, "uuid", uuidFake);
    try {
      await main({ session });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
