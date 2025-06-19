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

const idempotencyKey = "some-idempotency-key";

describe("Dwolla suspend customer", () => {
  afterEach(() => {
    restore();
  });
  it("it should post correctly", async () => {
    const responseBody = "some-response-body";
    const response = {
      body: responseBody,
    };
    const deleteFake = fake.returns(response);
    const dwollaClient = {
      delete: deleteFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const result = await dwolla(key, secret, {
      environment,
    }).businessAuthority.delete(id, { idempotencyKey });

    expect(result).to.equal(responseBody);
    expect(dwollaFake).to.have.been.calledWith(key, secret, { environment });
    expect(deleteFake).to.have.been.calledWith(
      `beneficial-owners/${id}`,
      {},
      {
        "Idempotency-Key": idempotencyKey,
      }
    );
  });
  it("it should post correctly with 404", async () => {
    const message = "some-error-message";
    const deleteError = new Error(message);
    deleteError.statusCode = 404;
    const deleteFake = fake.rejects(deleteError);
    const dwollaClient = {
      delete: deleteFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.resourceNotFoundError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.delete(id, { idempotencyKey });

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This authority wasn't found.",
        {
          info: { errors: [{ message }] },
          source: deleteError,
        }
      );
      expect(e).to.equal(error);
    }
  });
  it("it should post correctly with default", async () => {
    const message = "some-error-message";
    const deleteError = new Error(message);
    const deleteFake = fake.rejects(deleteError);
    const dwollaClient = {
      delete: deleteFake,
    };
    const dwollaFake = fake.returns(dwollaClient);
    replace(deps, "dwolla", dwollaFake);

    const error = new Error();
    const messageFake = fake.returns(error);
    replace(deps.badRequestError, "message", messageFake);

    try {
      await dwolla(key, secret, {
        environment,
      }).businessAuthority.delete(id, { idempotencyKey });

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This authority couldn't be made.",
        {
          info: { errors: [{ message }] },
          source: deleteError,
        }
      );
      expect(e).to.equal(error);
    }
  });
});
