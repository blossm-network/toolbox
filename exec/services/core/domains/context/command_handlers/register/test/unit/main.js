const { expect } = require("chai").use(require("sinon-chai"));
const { replace, restore, fake } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

const payload = "some-payload";
const root = "some-root";
const service = "some-service";
const network = "some-network";
const contextSession = "some-context-session";
const principleRoot = "some-principle-root";
const principleService = "some-principle-service";
const principleNetwork = "some-principle-network";

const context = {
  session: contextSession
};

const session = {
  a: 1
};

process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Command handler unit tests", () => {
  afterEach(() => {
    restore();
  });
  it("should return successfully", async () => {
    const uuid = "some-uuid";
    const uuidFake = fake.returns(uuid);
    replace(deps, "uuid", uuidFake);

    const tokens = "some-tokens";
    const issueFake = fake.returns({ tokens });
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
      session
    });
    expect(result).to.deep.equal({
      events: [
        {
          domain: "principle",
          service,
          network,
          action: "add-roles",
          root: uuid,
          payload: {
            roles: [{ id: "ContextAdmin", service, network }]
          }
        },
        {
          domain: "principle",
          service,
          network,
          action: "add-contexts",
          root: uuid,
          payload: {
            contexts: [{ root, service, network }]
          }
        },
        { action: "register", payload, root, correctNumber: 0 }
      ],
      response: {
        principle: {
          root: uuid,
          service,
          network
        },
        tokens
      }
    });
    expect(commandFake).to.have.been.calledWith({
      domain: "session",
      name: "upgrade"
    });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      {
        principle: { root: uuid, service, network }
      },
      { root: contextSession }
    );
  });
  it("should return successfully if there's a context principle", async () => {
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

    const principleContext = {
      session: contextSession,
      principle: {
        root: principleRoot,
        service: principleService,
        network: principleNetwork
      }
    };
    const result = await main({
      payload,
      root,
      context: principleContext,
      session
    });
    expect(result).to.deep.equal({
      events: [
        {
          domain: "principle",
          service: principleService,
          network: principleNetwork,
          action: "add-roles",
          root: principleRoot,
          payload: {
            roles: [{ id: "ContextAdmin", service, network }]
          }
        },
        {
          domain: "principle",
          service: principleService,
          network: principleNetwork,
          action: "add-contexts",
          root: principleRoot,
          payload: {
            contexts: [{ root, service, network }]
          }
        },
        { action: "register", payload, root, correctNumber: 0 }
      ],
      response: {
        principle: {
          root: principleRoot,
          service: principleService,
          network: principleNetwork
        }
      }
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const uuidFake = fake.throws(errorMessage);
    replace(deps, "uuid", uuidFake);
    try {
      await main({ context: {} });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
