import assert from "node:assert/strict";
import { protos } from "@google-cloud/scheduler";
import { replace, restore } from "sinon";
import schedule from "../index.js";

const uri = "https://service.example.invalid/task";
const oidcToken = {
  serviceAccountEmail: "scheduler@example.invalid",
  audience: "https://service.example.invalid",
};

describe("Scheduler HTTP contract", () => {
  afterEach(restore);
  it("sends JSON with JSON Content-Type and native OIDC authentication", async () => {
    let request;
    replace(schedule.__client, "createJob", async (value) => {
      request = value;
      return [{}];
    });
    await schedule.create({
      url: uri,
      data: { a: 1 },
      oidcToken,
      schedule: "* * * * *",
      project: "dummy",
      location: "us-east1",
    });
    const target = request.job.httpTarget;
    assert.equal(target.headers["content-type"], "application/json");
    assert.deepEqual(JSON.parse(target.body.toString()), { a: 1 });
    assert.deepEqual(target.oidcToken, oidcToken);
    assert.equal(target.oauthToken, undefined);
    const message =
      protos.google.cloud.scheduler.v1.HttpTarget.fromObject(target);
    assert.equal(
      protos.google.cloud.scheduler.v1.HttpTarget.verify(message),
      null
    );
  });
  it("accepts the existing token argument as a native OAuthToken configuration", async () => {
    let request;
    replace(schedule.__client, "createJob", async (value) => {
      request = value;
      return [{}];
    });
    const token = { serviceAccountEmail: "scheduler@example.invalid" };
    await schedule.create({
      url: uri,
      data: {},
      token,
      project: "dummy",
      location: "us-east1",
    });
    const message = protos.google.cloud.scheduler.v1.HttpTarget.fromObject(
      request.job.httpTarget
    );
    assert.equal(
      protos.google.cloud.scheduler.v1.HttpTarget.verify(message),
      null
    );
    assert.equal(
      message.oauthToken.serviceAccountEmail,
      token.serviceAccountEmail
    );
  });
});
