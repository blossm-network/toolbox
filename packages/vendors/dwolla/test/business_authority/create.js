import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import deps from "../../deps.js";
import dwolla from "../../index.js";

chai.use(sinonChai);
const { expect } = chai;

const key = "some-key";
const secret = "some-secret";
const environment = "some-environment";

const id = "some-id";

const firstName = "some-first-name";
const lastName = "some-last-name";
const dateOfBirth = "some-dob";
const ssn = "some-ssn";

const address1 = "some-address1";
const address2 = "some-address2";
const city = "some-city";
const state = "some-state";
const postalCode = "some-postal-code";
const country = "some-country";

const passportNumber = "some-passport-number";
const passportCountry = "some-passport-country";

const idempotencyKey = "some-idempotency-key";

describe("Dwolla create business customer authority", () => {
  afterEach(() => {
    restore();
  });
  it("it should post correctly", async () => {
    const location = "some-location";
    const getFake = fake.returns(location);
    const responseHeaders = {
      get: getFake,
    };
    const response = {
      headers: responseHeaders,
    };
    const postFake = fake.returns(response);
    const dwollaClient = {
      post: postFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const result = await dwolla(key, secret, {
      environment,
    }).businessAuthority.create(
      id,
      {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          address2,
          city,
          state,
          postalCode,
          country,
        },
        passport: {
          number: passportNumber,
          country: passportCountry,
        },
      },
      { idempotencyKey }
    );

    expect(result).to.equal(location);
    expect(dwollaFake).to.have.been.calledWith(key, secret, { environment });
    expect(postFake).to.have.been.calledWith(
      `customers/${id}/beneficial-owners`,
      {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          address2,
          city,
          stateProvinceRegion: state,
          country,
          postalCode,
        },
        passport: {
          number: passportNumber,
          country: passportCountry,
        },
      },
      { "Idempotency-Key": idempotencyKey }
    );
  });
  it("it should post correctly without optionals", async () => {
    const location = "some-location";
    const getFake = fake.returns(location);
    const responseHeaders = {
      get: getFake,
    };
    const response = {
      headers: responseHeaders,
    };
    const postFake = fake.returns(response);
    const dwollaClient = {
      post: postFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const result = await dwolla(key, secret, {
      environment,
    }).businessAuthority.create(
      id,
      {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          city,
          state,
          postalCode,
          country,
        },
      },
      { idempotencyKey }
    );

    expect(result).to.equal(location);
    expect(dwollaFake).to.have.been.calledWith(key, secret, { environment });
    expect(postFake).to.have.been.calledWith(
      `customers/${id}/beneficial-owners`,
      {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          city,
          stateProvinceRegion: state,
          country,
          postalCode,
        },
      },
      { "Idempotency-Key": idempotencyKey }
    );
  });
  it("it should post correctly with 400 validation", async () => {
    const message = "some-error-message";
    const postError = new Error(message);
    const errorMessage0 = "some-error";
    const path0 = "/somePath/yep";
    const errorMessage1 = "some-other-error";
    const path1 = "/someOtherPath/";
    postError.statusCode = 400;
    postError.code = "ValidationError";
    postError.body = {
      _embedded: {
        errors: [
          { message: errorMessage0, path: path0 },
          { message: errorMessage1, path: path1 },
        ],
      },
    };
    const postFake = fake.rejects(postError);
    const dwollaClient = {
      post: postFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.badRequestError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.create(id, {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          city,
          state,
          postalCode,
          country,
        },
      });

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Some information was missing when creating this authority.",
        {
          info: {
            errors: [
              {
                message: errorMessage0,
                path: "somePath.yep",
              },
              {
                message: errorMessage1,
                path: "someOtherPath",
              },
            ],
          },
          source: postError,
        }
      );
      expect(e).to.equal(error);
    }
  });
  it("it should post correctly with 400 default", async () => {
    const message = "some-error-message";
    const postError = new Error(message);
    postError.statusCode = 400;
    const postFake = fake.rejects(postError);
    const dwollaClient = {
      post: postFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.badRequestError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.create(id, {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          city,
          state,
          postalCode,
          country,
        },
      });

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This authority couldn't be made.",
        {
          info: { errors: [{ message }] },
          source: postError,
        }
      );
      expect(e).to.equal(error);
    }
  });
  it("it should post correctly with 403 default", async () => {
    const message = "some-error-message";
    const postError = new Error(message);
    postError.statusCode = 403;
    const postFake = fake.rejects(postError);
    const dwollaClient = {
      post: postFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.forbiddenError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.create(id, {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          city,
          state,
          postalCode,
          country,
        },
      });

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "You aren't allowed to create this authority.",
        {
          info: { errors: [{ message }] },
          source: postError,
        }
      );
      expect(e).to.equal(error);
    }
  });
  it("it should post correctly with default", async () => {
    const message = "some-error-message";
    const postError = new Error(message);
    const postFake = fake.rejects(postError);
    const dwollaClient = {
      post: postFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.badRequestError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.create(id, {
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        address: {
          address1,
          city,
          state,
          postalCode,
          country,
        },
      });

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This authority couldn't be made.",
        {
          info: { errors: [{ message }] },
          source: postError,
        }
      );
      expect(e).to.equal(error);
    }
  });
});
