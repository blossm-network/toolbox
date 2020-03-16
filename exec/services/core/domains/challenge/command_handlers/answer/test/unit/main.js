const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();
const challengePrincipleRoot = "some-challenge-principle-root";
const challengePrinciple = {
  root: challengePrincipleRoot
};
const code = "some-code";
const exp = "some-exp";
const iss = "some-iss";
const aud = "some-aud";
const challenge = {
  code,
  principle: challengePrinciple,
  claims: {
    exp,
    iss,
    aud
  }
};
const payload = {
  code
};
const contextChallenge = "some-challenge-context";
const sessionRoot = "some-session-root";
const context = {
  challenge: {
    root: contextChallenge
  },
  session: { root: sessionRoot }
};
const service = "some-service";
const network = "some-network";
const tokens = "some-tokens";
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
      context,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      events: [
        {
          action: "answer",
          payload: {
            answered: deps.stringDate()
          },
          root: contextChallenge,
          correctNumber: 1
        }
      ],
      response: { tokens }
    });
    expect(aggregateFake).to.have.been.calledWith(contextChallenge);
    expect(commandFake).to.have.been.calledWith({
      domain: "session",
      name: "upgrade"
    });
    expect(setFake).to.have.been.calledWith({
      context,
      claims: {
        iss,
        exp,
        aud
      },
      tokenFn: deps.gcpToken
    });
    expect(issueFake).to.have.been.calledWith(
      {
        principle: challengePrincipleRoot
      },
      { root: sessionRoot }
    );
  });
  it("should return successfully if claims.sub is provided.", async () => {
    const aggregateFake = fake.returns({
      aggregate: {
        ...challenge,
        claims: {
          sub: "some-sub"
        },
        expires: deps.stringDate()
      }
    });

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
      context,
      aggregateFn: aggregateFake
    });

    expect(result).to.deep.equal({
      events: [
        {
          action: "answer",
          payload: {
            answered: deps.stringDate()
          },
          root: contextChallenge,
          correctNumber: 1
        }
      ]
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
