const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers, stub } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const contextPrinciple = "some-context-principle";
const identityId = "some-identity-id";
const contextType = "some-context-type";
const challengeRoot = "some-challenge-root";
const identity = {
  contexts: [
    {
      type: contextType,
      root: challengeRoot
    }
  ],
  id: identityId
};
const code = "some-code";
const challenge = {
  code
};
const payload = {
  code
};
const contextChallenge = "some-challenge-context";
const contextIdentity = "some-context-identity";
const context = {
  principle: contextPrinciple,
  challenge: contextChallenge,
  identity: contextIdentity
};
const service = "some-service";
const network = "some-network";
const token = "some-token";
const project = "some-projectl";

process.env.SERVICE = service;
process.env.NETWORK = network;
process.env.GCP_PROJECT = project;

describe("Command handler unit tests", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should return successfully", async () => {
    const aggregateFake = fake.returns({
      state: {
        ...challenge,
        expires: deps.stringDate()
      }
    });
    const otherAggregateFake = fake.returns({ state: identity });
    const setFake = stub()
      .onFirstCall()
      .returns({
        aggregate: aggregateFake
      })
      .onSecondCall()
      .returns({
        aggregate: otherAggregateFake
      });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const result = await main({
      payload,
      root: challengeRoot,
      context
    });

    expect(result).to.deep.equal({
      events: [
        {
          payload: {
            answered: deps.stringDate()
          },
          root: challengeRoot
        }
      ],
      response: { token }
    });
    expect(aggregateFake).to.have.been.calledWith(challengeRoot);
    expect(otherAggregateFake).to.have.been.calledWith(contextIdentity);
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledTwice;
    expect(eventStoreFake).to.have.been.calledWith({
      domain: "challenge"
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain: "identity"
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "auth",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `answer.challenge.${service}.${network}`,
        subject: contextPrinciple,
        audience: `${service}.${network}`,
        expiresIn: 7776000
      },
      payload: {
        context: {
          identity: contextIdentity,
          [contextType]: challengeRoot,
          service,
          network
        }
      },
      signFn: signature
    });
  });
  it("should return successfully if no identity is found", async () => {
    const aggregateFake = fake.returns({
      state: {
        ...challenge,
        expires: deps.stringDate()
      }
    });
    const otherAggregateFake = fake.returns();
    const setFake = stub()
      .onFirstCall()
      .returns({
        aggregate: aggregateFake
      })
      .onSecondCall()
      .returns({
        aggregate: otherAggregateFake
      });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const result = await main({ payload, root: challengeRoot, context });

    expect(result).to.deep.equal({
      events: [
        {
          root: challengeRoot,
          payload: {
            answered: deps.stringDate()
          }
        }
      ],
      response: { token }
    });
    expect(aggregateFake).to.have.been.calledWith(challengeRoot);
    expect(otherAggregateFake).to.have.been.calledWith(contextIdentity);
    expect(setFake).to.have.been.calledWith({
      context,
      tokenFn: deps.gcpToken
    });
    expect(setFake).to.have.been.calledTwice;
    expect(eventStoreFake).to.have.been.calledWith({
      domain: "challenge"
    });
    expect(eventStoreFake).to.have.been.calledWith({
      domain: "identity"
    });
    expect(signFake).to.have.been.calledWith({
      ring: service,
      key: "auth",
      location: "global",
      version: "1",
      project
    });
    expect(createJwtFake).to.have.been.calledWith({
      options: {
        issuer: `answer.challenge.${service}.${network}`,
        subject: contextPrinciple,
        audience: `${service}.${network}`,
        expiresIn: 7776000
      },
      payload: {
        context: {
          identity: contextIdentity,
          service,
          network
        }
      },
      signFn: signature
    });
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const aggregateFake = fake.rejects(errorMessage);
    const setFake = fake.returns({
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);
    try {
      await main({ payload, context });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should throw correctly if no challenge is found", async () => {
    const aggregateFake = fake.returns();
    const setFake = fake.returns({
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const error = "some-error";
    const codeNotRecognizedFake = fake.returns(error);
    replace(deps, "invalidArgumentError", {
      codeNotRecognized: codeNotRecognizedFake
    });

    try {
      await main({ payload, context });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if a challenge is with the wrong code", async () => {
    const aggregateFake = fake.returns({
      state: {
        ...challenge,
        code: "bogus",
        expires: deps.stringDate()
      }
    });
    const setFake = fake.returns({
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const error = "some-error";
    const wrongCodeFake = fake.returns(error);
    replace(deps, "invalidArgumentError", {
      wrongCode: wrongCodeFake
    });

    try {
      await main({ payload, root: challengeRoot, context });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if a challenge is expired", async () => {
    const aggregateFake = fake.returns({
      state: {
        ...challenge,
        expires: deps
          .moment()
          .subtract(1, "s")
          .toDate()
          .toISOString()
      }
    });
    const setFake = fake.returns({
      aggregate: aggregateFake
    });
    const eventStoreFake = fake.returns({
      set: setFake
    });
    replace(deps, "eventStore", eventStoreFake);

    const error = "some-error";
    const codeExpiredFake = fake.returns(error);
    replace(deps, "invalidArgumentError", {
      codeExpired: codeExpiredFake
    });

    try {
      await main({ payload, root: challengeRoot, context });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
