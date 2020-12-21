const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const dwolla = require("../..");

const deps = require("../../deps");

const key = "some-key";
const secret = "some-secret";
const environment = "some-environment";

const id = "some-id";

const status = "some-verification-status";

describe("Dwolla get business authority status", () => {
  afterEach(() => {
    restore();
  });
  it("it should get correctly", async () => {
    const responseBody = {
      status,
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
    }).customer.getBusinessAuthorityStatus(id);

    expect(result).to.deep.equal({
      status,
    });
    expect(dwollaFake).to.have.been.calledWith(key, secret, { environment });
    expect(getFake).to.have.been.calledWith(
      `customers/${id}/beneficial-ownership`,
      {}
    );
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
      }).customer.getBusinessAuthorityStatus(id);

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
      }).customer.getBusinessAuthorityStatus(id);

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This customer couldn't be made.",
        {
          info: { errors: [{ message }] },
          source: getError,
        }
      );
      expect(e).to.equal(error);
    }
  });
});
