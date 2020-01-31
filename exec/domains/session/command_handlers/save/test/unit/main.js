const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, stub, useFakeTimers } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

let clock;
const now = new Date();

const email = "some-email";
const payload = { email };
const token = "some-token";
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
  it("should return successfully", async () => {
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

    const issueFake = fake.returns({ token });
    const anotherSetFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: anotherSetFake
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
          action: "add-permissions",
          domain: "principle",
          root: principle,
          payload: {
            permissions: ["some-other-permissions"]
          }
        }
      ],
      response: { token }
    });
    // expect(aggregateFake).to.have.been.calledWith(root);
    // expect(signFake).to.have.been.calledWith({
    //   ring: service,
    //   key: "auth",
    //   location: "global",
    //   version: "1",
    //   project
    // });
    // expect(createJwtFake).to.have.been.calledWith({
    //   options: {
    //     issuer: iss,
    //     subject: principle,
    //     audience: aud,
    //     expiresIn: Date.parse(exp) - deps.fineTimestamp()
    //   },
    //   payload: {
    //     context
    //   },
    //   signFn: signature
    // });
  });
  // it("should throw correctly if session terminated", async () => {
  //   const signature = "some-signature";
  //   const signFake = fake.returns(signature);
  //   replace(deps, "sign", signFake);

  //   const createJwtFake = fake.returns(token);
  //   replace(deps, "createJwt", createJwtFake);

  //   const aggregateFake = fake.returns({ aggregate: { terminated: true } });

  //   const error = "some-error";
  //   const sessionTerminatedFake = fake.returns(error);
  //   replace(deps, "badRequestError", {
  //     sessionTerminated: sessionTerminatedFake
  //   });

  //   try {
  //     await main({
  //       payload,
  //       root,
  //       context,
  //       aggregateFn: aggregateFake
  //     });
  //     //shouldn't get called
  //     expect(2).to.equal(3);
  //   } catch (e) {
  //     expect(e).to.equal(error);
  //   }
  // });

  // it("should throw correctly if session has already been upgraded", async () => {
  //   const signature = "some-signature";
  //   const signFake = fake.returns(signature);
  //   replace(deps, "sign", signFake);

  //   const createJwtFake = fake.returns(token);
  //   replace(deps, "createJwt", createJwtFake);

  //   const aggregateFake = fake.returns({
  //     aggregate: { terminated: false, upgraded: true }
  //   });

  //   const error = "some-error";
  //   const sessionAlreadyUpgradedFake = fake.returns(error);
  //   replace(deps, "badRequestError", {
  //     sessionAlreadyUpgraded: sessionAlreadyUpgradedFake
  //   });

  //   try {
  //     await main({
  //       payload,
  //       root,
  //       context,
  //       aggregateFn: aggregateFake
  //     });
  //     //shouldn't get called
  //     expect(2).to.equal(3);
  //   } catch (e) {
  //     expect(e).to.equal(error);
  //   }
  // });
  // it("should throw correctly", async () => {
  //   const signature = "some-signature";
  //   const signFake = fake.returns(signature);
  //   replace(deps, "sign", signFake);

  //   const errorMessage = "some-error";
  //   const createJwtFake = fake.rejects(errorMessage);
  //   replace(deps, "createJwt", createJwtFake);

  //   const aggregateFake = fake.returns({
  //     aggregate: { terminated: false, upgraded: false }
  //   });

  //   try {
  //     await main({
  //       payload,
  //       root,
  //       context,
  //       session,
  //       aggregateFn: aggregateFake
  //     });
  //     //shouldn't get called
  //     expect(2).to.equal(3);
  //   } catch (e) {
  //     expect(e.message).to.equal(errorMessage);
  //   }
  // });
});
