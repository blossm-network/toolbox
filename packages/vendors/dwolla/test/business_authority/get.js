const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake } = require("sinon");
const dwolla = require("../..");

const deps = require("../../deps");

const key = "some-key";
const secret = "some-secret";
const environment = "some-environment";

const id = "some-id";

const firstName = "some-first-name";
const lastName = "some-last-name";
const verificationStatus = "some-verification-status";

const address1 = "some-address-1";
const address2 = "some-address-2";
const city = "some-city";
const stateProvinceRegion = "some-state";
const country = "some-country";
const postalCode = "some-postal-code";

describe("Dwolla get customer", () => {
  afterEach(() => {
    restore();
  });
  it("it should get correctly", async () => {
    const responseBody = {
      firstName,
      lastName,
      address: {
        address1,
        address2,
        city,
        stateProvinceRegion,
        country,
        postalCode,
      },
      verificationStatus,
    };

    const response = {
      body: responseBody,
    };
    const getFake = fake.returns(response);
    const dwollaClient = {
      get: getFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const result = await dwolla(key, secret, {
      environment,
    }).businessAuthority.get(id);

    expect(result).to.deep.equal({
      firstName,
      lastName,
      address: {
        address1,
        address2,
        city,
        state: stateProvinceRegion,
        country,
        postalCode,
      },
      verificationStatusType: verificationStatus,
    });
    expect(dwollaFake).to.have.been.calledWith(key, secret, { environment });
    expect(getFake).to.have.been.calledWith(`beneficial-owners/${id}`, {});
  });
  it("it should get correctly with 404", async () => {
    const message = "some-error-message";
    const getError = new Error(message);
    getError.statusCode = 404;
    const getFake = fake.rejects(getError);
    const dwollaClient = {
      get: getFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.resourceNotFoundError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.get(id);

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This authority wasn't found.",
        {
          info: { errors: [{ message }] },
          source: getError,
        }
      );
      expect(e).to.equal(error);
    }
  });
  it("it should get correctly with default", async () => {
    const message = "some-error-message";
    const getError = new Error(message);
    const getFake = fake.rejects(getError);
    const dwollaClient = {
      get: getFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.badRequestError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.get(id);

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This authority couldn't be made.",
        {
          info: { errors: [{ message }] },
          source: getError,
        }
      );
      expect(e).to.equal(error);
    }
  });
});
