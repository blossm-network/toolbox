const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const contextPrinciple = "some-context-principle";
const challengePrinciple = "some-challenge-principle";
const code = "some-code";
const challenge = {
  code,
  principle: challengePrinciple
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
      aggregate: {
        ...challenge,
        expires: deps.stringDate()
      }
    });

    const signature = "some-signature";
    const signFake = fake.returns(signature);
    replace(deps, "sign", signFake);

    const createJwtFake = fake.returns(token);
    replace(deps, "createJwt", createJwtFake);

    const result = await main({
      payload,
      context,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      events: [
        {
          payload: {
            answered: deps.stringDate()
          },
          root: contextChallenge,
          correctNumber: 1
        }
      ],
      response: { token }
    });
    expect(aggregateFake).to.have.been.calledWith(contextChallenge);
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
        subject: challengePrinciple,
        audience: `${service}.${network}`,
        expiresIn: 7776000
      },
      payload: {
        context: {
          ...context,
          principle: contextPrinciple,
          challenge: contextChallenge,
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
    try {
      await main({ payload, context, aggregateFn: aggregateFake });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
  it("should throw correctly if a challenge is with the wrong code", async () => {
    const aggregateFake = fake.returns({
      aggregate: {
        ...challenge,
        code: "bogus",
        expires: deps.stringDate()
      }
    });

    const error = "some-error";
    const wrongCodeFake = fake.returns(error);
    replace(deps, "invalidArgumentError", {
      wrongCode: wrongCodeFake
    });

    try {
      await main({ payload, context, aggregateFn: aggregateFake });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if a challenge is expired", async () => {
    const aggregateFake = fake.returns({
      aggregate: {
        ...challenge,
        expires: deps
          .moment()
          .subtract(1, "s")
          .toDate()
          .toISOString()
      }
    });

    const error = "some-error";
    const codeExpiredFake = fake.returns(error);
    replace(deps, "invalidArgumentError", {
      codeExpired: codeExpiredFake
    });

    try {
      await main({
        payload,
        context,
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
