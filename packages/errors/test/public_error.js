import { expect } from "chai";
import {
  invalidArgument,
  internalServer,
  forbidden,
  publicError,
} from "../index.js";

describe("Public error contract", () => {
  it("preserves validation paths and messages without submitted values or causes", () => {
    const error = invalidArgument.message("Some information is invalid.", {
      cause: new Error("FAKE_PASSWORD"),
      info: {
        errors: [
          {
            path: "profile.name",
            message: "This name is required.",
            value: "FAKE_PASSWORD",
            token: "FAKE_TOKEN",
          },
        ],
        token: "FAKE_TOKEN",
      },
    });
    expect(error.toJSON()).to.deep.equal({
      statusCode: 409,
      code: "InvalidArgument",
      message: "Some information is invalid.",
      info: {
        errors: [{ path: "profile.name", message: "This name is required." }],
      },
    });
    // Internal diagnostics remain available to their owner, without being public.
    expect(error.info().token).to.equal("FAKE_TOKEN");
    expect(error.cause().message).to.equal("FAKE_PASSWORD");
  });
  it("preserves the configured authentication redirect", () => {
    expect(
      forbidden
        .message("Authenticate first.", {
          info: { redirect: "https://login.example", token: "FAKE_TOKEN" },
        })
        .toJSON().info
    ).to.deep.equal({ redirect: "https://login.example" });
  });
  it("hides internal server messages, causes and validation diagnostics", () => {
    expect(
      internalServer
        .message("Database URL: FAKE_PASSWORD", {
          info: { errors: [{ message: "FAKE_TOKEN" }] },
        })
        .toJSON()
    ).to.deep.equal({
      statusCode: 500,
      code: "InternalServer",
      message: "An internal server error occurred.",
      info: {},
    });
  });
  it("does not trust an arbitrary error's toJSON or diagnostic properties", () => {
    const error = {
      statusCode: 404,
      message: "Not found.",
      code: "ResourceNotFound",
      token: "FAKE_TOKEN",
      toJSON: () => ({ token: "FAKE_TOKEN" }),
      info: {
        password: "FAKE_PASSWORD",
        errors: [
          null,
          { message: "Missing name.", path: "name", value: "FAKE_PASSWORD" },
        ],
      },
    };
    expect(JSON.stringify(publicError(error))).not.to.match(/FAKE_/);
  });
});
