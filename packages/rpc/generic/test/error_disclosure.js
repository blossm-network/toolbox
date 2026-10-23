import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import logger from "@blossm/logger";
import { construct } from "@blossm/errors";
import errorMiddleware from "../../../middleware/error/index.js";
import operation from "../index.js";
import deps from "../deps.js";

describe("RPC error disclosure boundary", () => {
  const previousHost = process.env.HOST;
  afterEach(() => {
    restore();
    if (previousHost === undefined) delete process.env.HOST;
    else process.env.HOST = previousHost;
  });

  for (const [statusCode, info] of [
    [404, { traceId: "trace-123", root: "root-456" }],
    [409, [{ root: "root-456", number: 3 }]],
    [500, { traceId: "trace-123", resourceId: "resource-456" }],
  ]) {
    it(`keeps credentials and request payloads out of ${statusCode} responses and logs`, async () => {
      process.env.HOST = "internal.example";
      const logs = [];
      replace(logger, "info", (...args) => logs.push(args));
      replace(logger, "error", (...args) => logs.push(args));
      replace(deps, "constructError", construct);
      replace(
        deps,
        "operationToken",
        fake.returns({ token: "FAKE_SERVICE_BEARER", type: "Bearer" })
      );
      replace(
        deps,
        "operationUrl",
        fake.returns("https://internal.example/private")
      );
      replace(
        deps,
        "post",
        fake.returns({
          statusCode,
          body: JSON.stringify({
            code: "Conflict",
            message: "The operation failed.",
            info,
          }),
        })
      );
      let error;
      try {
        await operation({
          region: "region",
          operationNameComponents: ["domain", "service", "name", "command"],
        })
          .post({ password: "FAKE_PASSWORD" })
          .in({ host: process.env.HOST })
          .with({ currentToken: "FAKE_CURRENT_TOKEN" });
      } catch (err) {
        error = err;
      }
      expect(error).to.be.instanceOf(Error);
      const serialized = error.toJSON();
      let payload;
      errorMiddleware(
        error,
        {
          body: { password: "FAKE_PASSWORD" },
          query: { token: "FAKE_CURRENT_TOKEN" },
          params: { secret: "FAKE_PASSWORD" },
        },
        {
          status: () => ({
            send: (body) => {
              payload = body;
            },
          }),
        },
        () => {}
      );
      for (const output of [serialized, payload, logs]) {
        expect(JSON.stringify(output)).not.to.match(/FAKE_/);
      }
      expect(serialized.info).to.deep.equal(info);
      expect(payload.info).to.deep.equal(info);
      expect(payload.message).to.equal("The operation failed.");
      expect(logs[1][1].info).to.deep.equal(info);
      expect(logs).to.have.lengthOf(2);
    });
  }
  it("keeps undeclared native diagnostics out of middleware responses and logs", () => {
    const logs = [];
    replace(logger, "error", (...args) => logs.push(args));
    const error = new Error("Database URL: FAKE_PASSWORD");
    error.info = { authorization: "FAKE_SERVICE_BEARER" };
    error.cause = new Error("FAKE_CURRENT_TOKEN");
    error.toJSON = () => {
      throw new Error("Must not execute arbitrary toJSON");
    };
    let payload;
    errorMiddleware(
      error,
      { body: { password: "FAKE_PASSWORD" } },
      {
        status: () => ({
          send: (body) => {
            payload = body;
          },
        }),
      },
      () => {}
    );
    expect(payload.message).to.equal("An internal server error occurred.");
    expect(payload.info).to.deep.equal({});
    expect(JSON.stringify([payload, logs])).not.to.match(/FAKE_|stack|cause/);
  });
});
