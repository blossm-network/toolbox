const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const challengePrinciple = "some-challenge-principle";
const code = "some-code";
const challenge = {
  code,
  principle: challengePrinciple
};
const session = "some-session";
const payload = {
  code
};
const contextChallenge = "some-challenge-context";
const sessionRoot = "some-session-root";
const context = {
  challenge: contextChallenge,
  session: sessionRoot
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
      context,
      session,
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
        principle: challengePrinciple
      },
      { root: sessionRoot }
    );
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const aggregateFake = fake.rejects(errorMessage);
    try {
      await main({ payload, context, session, aggregateFn: aggregateFake });
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
      await main({ payload, context, session, aggregateFn: aggregateFake });
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
        session,
        aggregateFn: aggregateFake
      });
      //shouldn't get called
      expect(2).to.equal(3);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
