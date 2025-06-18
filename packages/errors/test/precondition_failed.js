import * as chai from "chai";
import { preconditionFailed } from "../index.js";

const { expect } = chai;

const cause = new Error();
const info = { some: "info" };

describe("Precondition failed", () => {
  it("message correct", () => {
    const message = "some-message";
    const error = preconditionFailed.message(message);
    expect(error.toJSON()).to.deep.equal({
      statusCode: 412,
      info: {},
      code: "PreconditionFailed",
      message,
    });
  });
  it("message correct with props", () => {
    const message = "some-message";
    const error = preconditionFailed.message(message, { cause, info });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 412,
      cause,
      info,
      code: "PreconditionFailed",
      message,
    });
  });
});
