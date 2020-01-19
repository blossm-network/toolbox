const { expect } = require("chai").use(require("sinon-chai"));
const { fake, stub, restore, replace } = require("sinon");

const main = require("../../main");
const deps = require("../../deps");

const phone = "some-phone";

describe("Command handler unit tests", () => {
  afterEach(() => {
    restore();
  });
  it("should return successfully", async () => {
    const payload = {
      phone
    };
    const context = {
      a: 1
    };

    const identityRoot = "some-identity-root";
    const principleRoot = "some-principle-root";

    replace(
      deps,
      "uuid",
      stub()
        .onFirstCall()
        .returns(identityRoot)
        .onSecondCall()
        .returns(principleRoot)
    );

    const token = "some-token";
    const issueFake = fake.returns({
      token
    });
    const setFake = fake.returns({
      issue: issueFake
    });
    const commandFake = fake.returns({
      set: setFake
    });
    replace(deps, "command", commandFake);
    const result = await main({ payload, context });
    expect(result).to.deep.equal({
      events: [
        {
          action: "add-permissions",
          domain: "principle",
          payload: { permissions: [`identity:admin:${identityRoot}`] },
          root: principleRoot,
          correctNumber: 0
        },
        {
          action: "attempt-register",
          payload: {
            phone,
            principle: principleRoot
          },
          root: identityRoot,
          correctNumber: 0
        }
      ],
      response: { token }
    });
    expect(issueFake).to.have.been.calledWith(
      {
        phone
      },
      {
        options: {
          events: [
            {
              root: identityRoot,
              action: "register",
              domain: "identity",
              payload: {
                phone
              },
              correctNumber: 1
            }
          ],
          exists: false
        }
      }
    );
    expect(setFake).to.have.been.calledWith({
      context: {
        a: 1,
        identity: identityRoot,
        principle: principleRoot
      },
      token: deps.gcpToken
    });
  });
});
