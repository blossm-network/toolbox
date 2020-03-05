const { expect } = require("chai").use(require("sinon-chai"));
const { replace, restore, fake, stub } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

const payloadDomain = "some-payload-domain";
const payload = { domain: payloadDomain };
const identity = "some-identity";
const context = { identity };
const session = {
  a: 1
};

const domain = "some-domain";
const service = "some-service";
const network = "some-network";

process.env.DOMAIN = domain;
process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Command handler unit tests", () => {
  afterEach(() => {
    restore();
  });
  it("should return successfully", async () => {
    const nodeRoot = "some-node-root";
    const contextRoot = "some-context-root";

    const uuidFake = stub()
      .onFirstCall()
      .returns(nodeRoot)
      .onSecondCall()
      .returns(contextRoot);

    replace(deps, "uuid", uuidFake);

    const tokens = "some-tokens";
    const principle = "some-principle";
    const issueFake = fake.returns({ tokens, principle });
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);

    const result = await main({ payload, context, session });
    expect(result).to.deep.equal({
      events: [
        {
          domain: "principle",
          action: "add-permissions",
          root: principle,
          payload: {
            permissions: [`node:admin:${nodeRoot}`]
          }
        },
        {
          action: "register",
          root: nodeRoot,
          payload: {
            domain: payloadDomain,
            context: contextRoot
          }
        }
      ],
      response: { tokens }
    });
    expect(commandFake).to.have.been.calledWith({
      name: "register",
      domain: "context"
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      {
        root: nodeRoot,
        domain,
        service,
        network
      },
      { root: contextRoot }
    );
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const uuidFake = fake.rejects(errorMessage);
    replace(deps, "uuid", uuidFake);
    try {
      await main({});
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
