import { expect } from "chai";
import restifyErrors from "restify-errors";
import createError from "../src/create_error.js";
import {
  invalidArgument,
  internalServer,
  forbidden,
  publicError,
  construct,
} from "../index.js";

describe("Public error contract", () => {
  it("preserves declared validation and audit metadata without causes or stacks", () => {
    const info = {
      traceId: "trace-123",
      root: "root-456",
      errors: [{ path: "profile.name", message: "This name is required." }],
      expected: { domain: "accounts", service: "registration" },
    };
    const error = invalidArgument.message("Some information is invalid.", {
      cause: invalidArgument.message("FAKE_PASSWORD", {
        info: { token: "FAKE_TOKEN" },
      }),
      info,
    });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      message: "Some information is invalid.",
      info,
    });
    expect(JSON.stringify(error)).not.to.match(/FAKE_|stack|cause/);
    expect(error.cause().message).to.equal("FAKE_PASSWORD");
    expect(error.info().token).to.equal("FAKE_TOKEN");
  });
  it("preserves conflict arrays supplied as public info", () => {
    const info = [
      { root: "root-456", number: 3 },
      { root: "root-789", number: 9 },
    ];
    expect(
      invalidArgument.message("Already saved.", { info }).toJSON().info
    ).to.deep.equal(info);
  });
  it("preserves the configured authentication redirect and audit metadata", () => {
    const info = { redirect: "https://login.example", traceId: "trace-123" };
    expect(
      forbidden.message("Authenticate first.", { info }).toJSON().info
    ).to.deep.equal(info);
  });
  it("preserves explicitly declared server messages and audit metadata", () => {
    const info = { traceId: "trace-123", resourceId: "resource-456" };
    expect(
      internalServer
        .message("The upstream service is unavailable.", { info })
        .toJSON()
    ).to.deep.equal({
      statusCode: 500,
      code: "InternalServer",
      message: "The upstream service is unavailable.",
      info,
    });
  });
  it("does not expose native error diagnostics or invoke arbitrary toJSON", () => {
    const error = new Error("Database URL: FAKE_PASSWORD");
    error.info = { password: "FAKE_PASSWORD" };
    error.cause = new Error("FAKE_TOKEN");
    error.toJSON = () => {
      throw new Error("Must not execute native toJSON");
    };
    error.info = () => {
      throw new Error("Must not execute undeclared info");
    };
    expect(publicError(error)).to.deep.equal({
      statusCode: 500,
      code: "InternalServer",
      message: "An internal server error occurred.",
      info: {},
    });
  });
});

describe("Public upstream fallback errors", () => {
  for (const [statusCode, expectedStatus] of [
    [503, 503],
    [302, 502],
  ]) {
    it(`retains declared public metadata for fallback ${expectedStatus}`, () => {
      const info = { traceId: "upstream-trace", resourceId: "resource-503" };
      const error = construct({ statusCode, info });
      expect(error.toJSON()).to.deep.equal({
        statusCode: expectedStatus,
        code: "UpstreamError",
        message: "The upstream request failed.",
        info,
      });
      expect(publicError(error).info).to.equal(info);
      expect(error.toJSON()).not.to.have.property("cause");
    });
  }

  it("keeps HttpError options and public info separate from a private cause", () => {
    const cause = internalServer.message("FAKE_PASSWORD", {
      info: { token: "FAKE_BEARER" },
    });
    const info = { traceId: "upstream-trace" };
    const error = createError(restifyErrors.HttpError, "Unavailable.", {
      statusCode: 503,
      code: "Unavailable",
      info,
      cause,
    });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 503,
      code: "Unavailable",
      message: "Unavailable.",
      info,
    });
    expect(error.cause()).to.equal(cause);
    expect(JSON.stringify(error)).not.to.match(/FAKE_|cause|stack/);
  });
});
