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

const filename = "some-filename";
const contentType = "some-content-type";
const knownLength = 3;
const data = "some-data";
const type = "some-document-type";

const idempotencyKey = "some-idempotency-key";

describe("Dwolla create business customer authority document", () => {
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

    const appendFake = fake();
    const body = {
      append: appendFake,
    };

    const formDataFake = fake.returns(body);
    replace(deps, "FormData", formDataFake);

    const result = await dwolla(key, secret, {
      environment,
    }).businessAuthority.createDocument(
      id,
      {
        data,
        filename,
        contentType,
        knownLength,
      },
      { type },
      { idempotencyKey }
    );

    expect(result).to.equal(location);
    expect(dwollaFake).to.have.been.calledWith(key, secret, { environment });
    expect(postFake).to.have.been.calledWith(
      `beneficial-owners/${id}/documents`,
      body,
      {
        "Idempotency-Key": idempotencyKey,
      }
    );
    expect(appendFake).to.have.been.calledWith("file", Buffer.from(data), {
      filename,
      contentType,
      knownLength,
    });
    expect(appendFake).to.have.been.calledWith("documentType", type);
    expect(appendFake).to.have.been.calledTwice;
    expect(formDataFake).to.have.been.calledWith();
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
      }).businessAuthority.createDocument(
        id,
        {
          data,
          filename,
          contentType,
          knownLength,
        },
        { type },
        { idempotencyKey }
      );

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "Some information was missing when creating a document for this authority.",
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
      }).businessAuthority.createDocument(
        id,
        {
          data,
          filename,
          contentType,
          knownLength,
        },
        { type },
        { idempotencyKey }
      );

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
      }).businessAuthority.createDocument(
        id,
        {
          data,
          filename,
          contentType,
          knownLength,
        },
        { type },
        { idempotencyKey }
      );

      //shouldn't be called.
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "You aren't allowed to create a document for this authority.",
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
      }).businessAuthority.createDocument(
        id,
        {
          data,
          filename,
          contentType,
          knownLength,
        },
        { type },
        { idempotencyKey }
      );

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
