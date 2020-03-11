const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();

const id = "some-id";
const phone = "some-phone";
const payload = { id, phone };
const tokens = "some-tokens";
const context = "some-context";
const service = "some-service";
const network = "some-network";

const sub = "some-sub";
const claims = {
  sub
};

const principleRoot = "some-principle-root";
const principleService = "some--principle-service";
const principleNetwork = "some--principle-network";

const identity = {
  state: {
    principle: {
      root: principleRoot,
      service: principleService,
      network: principleNetwork
    }
  }
};
const principleAggregate = { roles: [{ id: "some-role", service, network }] };
const sessionPrincipleAggregate = {
  roles: [{ id: "some-other-role", service, network }]
};

process.env.SERVICE = service;
process.env.NETWORK = network;

describe("Command handler unit tests", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should return successfully if identity is found", async () => {
    const queryFake = fake.returns([identity]);
    const otherQueryFake = fake.returns([]);
    const setFake = fake.returns({
      query: queryFake
    });
    const otherSetFake = fake.returns({
      query: otherQueryFake
    });
    const eventStoreFake = stub()
      .onFirstCall()
      .returns({
        set: setFake
      })
      .onSecondCall()
      .returns({ set: otherSetFake });
    replace(deps, "eventStore", eventStoreFake);

    const aggregateFake = stub()
      .onFirstCall()
      .returns({
        aggregate: principleAggregate
      })
      .onSecondCall()
      .returns({
        aggregate: sessionPrincipleAggregate
      });

    const issueFake = fake.returns({ tokens });
    const anotherSetFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: anotherSetFake
    });

    replace(deps, "command", commandFake);

    replace(deps, "compare", fake.returns(true));

    const result = await main({
      payload,
      context,
      claims,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(aggregateFake).to.have.been.calledWith(principleRoot, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledWith(sub, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledTwice;
    expect(commandFake).to.have.been.calledWith({
      name: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      claims: {
        ...claims,
        sub: principleRoot
      },
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { id, phone },
      {
        options: {
          principle: {
            root: principleRoot,
            service: principleService,
            network: principleNetwork
          },
          events: [
            {
              action: "add-roles",
              domain: "principle",
              root: principleRoot,
              payload: {
                roles: [{ id: "some-other-role", service, network }]
              }
            }
          ]
        }
      }
    );
  });
  it("should return successfully if identity is found and there are no new roles to add", async () => {
    const queryFake = fake.returns([identity]);
    const otherQueryFake = fake.returns([]);
    const setFake = fake.returns({
      query: queryFake
    });
    const otherSetFake = fake.returns({
      query: otherQueryFake
    });
    const eventStoreFake = stub()
      .onFirstCall()
      .returns({
        set: setFake
      })
      .onSecondCall()
      .returns({ set: otherSetFake });
    replace(deps, "eventStore", eventStoreFake);

    const aggregateFake = stub()
      .onFirstCall()
      .returns({
        aggregate: principleAggregate
      })
      .onSecondCall()
      .returns({
        aggregate: principleAggregate
      });

    const issueFake = fake.returns({ tokens });
    const anotherSetFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: anotherSetFake
    });

    replace(deps, "command", commandFake);

    replace(deps, "compare", fake.returns(true));

    const result = await main({
      payload,
      context,
      claims,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(aggregateFake).to.have.been.calledWith(principleRoot, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledWith(sub, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledTwice;
    expect(commandFake).to.have.been.calledWith({
      name: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      claims: {
        ...claims,
        sub: principleRoot
      },
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { phone, id },
      {
        options: {
          principle: {
            root: principleRoot,
            service: principleService,
            network: principleNetwork
          },
          events: []
        }
      }
    );
  });
  it("should return successfully if principle not found with no subject", async () => {
    const queryFake = fake.returns([]);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const identityRoot = "some-new-identity-root";
    const principleRoot = "some-new-principle-root";

    const uuidFake = stub()
      .onFirstCall()
      .returns(identityRoot)
      .onSecondCall()
      .returns(principleRoot);
    replace(deps, "uuid", uuidFake);

    const phoneHash = "some-phone-hash";
    const hashFake = fake.returns(phoneHash);
    replace(deps, "hash", hashFake);

    const issueFake = fake.returns({ tokens });
    const anotherSetFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: anotherSetFake
    });

    replace(deps, "command", commandFake);

    replace(deps, "compare", fake.returns(true));

    const result = await main({
      payload,
      context,
      claims: {}
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      claims: {},
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(hashFake).to.have.been.calledWith(phone);
    expect(commandFake).to.have.been.calledWith({
      name: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      claims: {
        sub: principleRoot
      },
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { id, phone },
      {
        options: {
          principle: { root: principleRoot, service, network },
          events: [
            {
              action: "register",
              domain: "identity",
              root: identityRoot,
              payload: {
                phone: phoneHash,
                id,
                principle: { root: principleRoot, service, network }
              }
            },
            {
              action: "add-roles",
              domain: "principle",
              root: principleRoot,
              payload: {
                roles: [{ id: `IdentityAdmin`, service, network }]
              }
            }
          ]
        }
      }
    );
  });
  it("should return successfully if principle not found with subject", async () => {
    const queryFake = fake.returns([]);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const identityRoot = "some-new-identity-root";

    const uuidFake = fake.returns(identityRoot);
    replace(deps, "uuid", uuidFake);

    const phoneHash = "some-phone-hash";
    const hashFake = fake.returns(phoneHash);
    replace(deps, "hash", hashFake);

    const issueFake = fake.returns({ tokens });
    const anotherSetFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: anotherSetFake
    });

    replace(deps, "command", commandFake);
    replace(deps, "compare", fake.returns(true));

    const result = await main({
      payload,
      context,
      claims
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      claims,
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(hashFake).to.have.been.calledWith(phone);
    expect(commandFake).to.have.been.calledWith({
      name: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      claims,
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { id, phone },
      {
        options: {
          principle: { root: sub, service, network },
          events: [
            {
              action: "register",
              domain: "identity",
              root: identityRoot,
              payload: {
                phone: phoneHash,
                id,
                principle: { root: sub, service, network }
              }
            },
            {
              action: "add-roles",
              domain: "principle",
              root: sub,
              payload: {
                roles: [{ id: "IdentityAdmin", service, network }]
              }
            }
          ]
        }
      }
    );
  });

  it("should return nothing if sub is the identity's principle", async () => {
    const queryFake = fake.returns([{ state: { principle: { root: sub } } }]);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);
    replace(deps, "compare", fake.returns(true));

    const result = await main({
      payload,
      context,
      claims
    });

    expect(result).to.deep.equal({});
  });
  it("should throw correctly if the session is saved to a different identity", async () => {
    const firstQueryFake = fake.returns([
      { state: { principle: { root: "some-random-root" } } }
    ]);
    const secondQueryFake = fake.returns(["something"]);
    const firstSetFake = fake.returns({
      query: firstQueryFake
    });
    const secondSetFake = fake.returns({
      query: secondQueryFake
    });
    const eventStoreFake = stub()
      .onFirstCall()
      .returns({
        set: firstSetFake
      })
      .onSecondCall()
      .returns({
        set: secondSetFake
      });
    replace(deps, "eventStore", eventStoreFake);
    replace(deps, "compare", fake.returns(true));

    try {
      await main({
        payload,
        context,
        claims
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(
        "The session is already saved to a different identity."
      );
    }
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";

    const queryFake = fake.rejects(errorMessage);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    replace(deps, "compare", fake.returns(true));
    try {
      await main({
        payload,
        context,
        claims
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should throw if compare fails", async () => {
    const queryFake = fake.returns([identity]);
    const setFake = fake.returns({
      query: queryFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const aggregateFake = stub()
      .onFirstCall()
      .returns({
        aggregate: principleAggregate
      })
      .onSecondCall()
      .returns({
        aggregate: sessionPrincipleAggregate
      });

    const issueFake = fake.returns({ tokens });
    const anotherSetFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: anotherSetFake
    });

    replace(deps, "command", commandFake);

    replace(deps, "compare", fake.returns(false));

    try {
      await main({
        payload,
        context,
        claims,
        aggregateFn: aggregateFake
      });

      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal("This phone number isn't right.");
    }
  });
});
