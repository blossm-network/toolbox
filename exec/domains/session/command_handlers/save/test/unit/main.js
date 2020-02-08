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

const sub = "some-sub";
const session = {
  sub
};

const principle = "some-principle";
const identity = {
  state: {
    principle
  }
};
const principleAggregate = { permissions: ["some-permission"] };
const sessionPrincipleAggregate = { permissions: ["some-other-permission"] };

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
      session,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(aggregateFake).to.have.been.calledWith(principle, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledWith(sub, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledTwice;
    expect(commandFake).to.have.been.calledWith({
      action: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      session: {
        ...session,
        sub: principle
      },
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { id, phone },
      {
        options: {
          principle,
          events: [
            {
              action: "add-permissions",
              domain: "principle",
              root: principle,
              payload: {
                permissions: ["some-other-permission"]
              }
            }
          ]
        }
      }
    );
  });
  it("should return successfully if identity is found and there are no new permissions to add", async () => {
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
      session,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(aggregateFake).to.have.been.calledWith(principle, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledWith(sub, {
      domain: "principle"
    });
    expect(aggregateFake).to.have.been.calledTwice;
    expect(commandFake).to.have.been.calledWith({
      action: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      session: {
        ...session,
        sub: principle
      },
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { phone, id },
      {
        options: {
          principle,
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
      session: {}
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      session: {},
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(hashFake).to.have.been.calledWith(phone);
    expect(commandFake).to.have.been.calledWith({
      action: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      session: {
        sub: principleRoot
      },
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { id, phone },
      {
        options: {
          principle: principleRoot,
          events: [
            {
              action: "register",
              domain: "identity",
              root: identityRoot,
              payload: {
                phone: phoneHash,
                id,
                principle: principleRoot
              }
            },
            {
              action: "principle",
              domain: "add-permissions",
              root: principleRoot,
              payload: {
                permissions: [`identity:admin:${identityRoot}`]
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
      session
    });

    expect(result).to.deep.equal({
      response: { tokens }
    });
    expect(eventStoreFake).to.have.been.calledWith({ domain: "identity" });
    expect(setFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(queryFake).to.have.been.calledWith({ key: "id", value: id });
    expect(hashFake).to.have.been.calledWith(phone);
    expect(commandFake).to.have.been.calledWith({
      action: "issue",
      domain: "challenge"
    });
    expect(anotherSetFake).to.have.been.calledWith({
      context,
      session,
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      { id, phone },
      {
        options: {
          principle: sub,
          events: [
            {
              action: "register",
              domain: "identity",
              root: identityRoot,
              payload: {
                phone: phoneHash,
                id,
                principle: sub
              }
            },
            {
              action: "principle",
              domain: "add-permissions",
              root: sub,
              payload: {
                permissions: [`identity:admin:${identityRoot}`]
              }
            }
          ]
        }
      }
    );
  });

  it("should return nothing if sub is the identity's principle", async () => {
    const queryFake = fake.returns([{ state: { principle: sub } }]);
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
      session
    });

    expect(result).to.deep.equal({});
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
        session
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
        session,
        aggregateFn: aggregateFake
      });

      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal("This phone number isn't right.");
    }
  });
});
