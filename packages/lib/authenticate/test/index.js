import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;
import { restore, replace, fake } from "sinon";
import { string as dateString } from "@blossm/datetime";

import deps from "../deps.js";

import authenticate from "../index.js";

const verifyFn = "some-verify-fn";

const basicTokenRoot = "some-basic-root";
const basicTokenSecret = "some-basic-secret";

const basicToken = `${basicTokenRoot}:${basicTokenSecret}`;

const buffer = Buffer.from(basicToken).toString("base64");

const claims = {
  exp: dateString(),
};
const audience = "some-audience";
const algorithm = "some-algorithm";

describe("Authorize", () => {
  afterEach(() => {
    restore();
  });
  it("should authentiate", async () => {
    const validateFake = fake.returns(claims);
    replace(deps, "validate", validateFake);

    const jwt = "some-jwt";
    const result = await authenticate({
      jwt,
      verifyFn,
      audience,
      algorithm,
    });

    expect(deps.validate).to.have.been.calledWith({
      token: jwt,
      verifyFn,
      audience,
      algorithm,
    });
    expect(result).to.deep.equal(claims);
  });
  it("should authenticate with basic token", async () => {
    const keyClaimsFnFake = fake.returns(claims);
    const response = await authenticate({
      basic: buffer,
      keyClaimsFn: keyClaimsFnFake,
    });

    expect(keyClaimsFnFake).to.have.been.calledWith({
      root: basicTokenRoot,
      secret: basicTokenSecret,
    });
    expect(response).to.deep.equal(claims);
  });
  it("should not authorize if there is no token", async () => {
    replace(deps, "validate", fake.returns(claims));

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await authenticate({
        verifyFn,
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Token not found.");
      expect(e).to.equal(error);
    }
  });
  it("should not authenticate with basic token but no keyClaimsFn", async () => {
    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      message: messageFake,
    });

    try {
      await authenticate({
        verifyFn,
        basic: buffer,
      });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("Token not found.");
      expect(e).to.equal(error);
    }
  });
});
