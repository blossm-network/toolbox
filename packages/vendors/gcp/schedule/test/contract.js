import assert from "node:assert/strict";
import { protos } from "@google-cloud/scheduler";
import { replace, restore } from "sinon";
import schedule from "../index.js";

const uri = "https://service.example.invalid/task";
const token = {
  serviceAccountEmail: "scheduler@example.invalid",
};

describe("Scheduler HTTP contract", () => {
  afterEach(restore);
  it("sends JSON with JSON Content-Type and native OAuth authentication", async () => {
    let request;
    replace(schedule.__client, "createJob", async (value) => {
      request = value;
      return [{}];
    });
    await schedule.create({
      url: uri,
      data: { a: 1, message: "hello 🌱", active: false },
      token,
      schedule: "* * * * *",
      project: "dummy",
      location: "us-east1",
    });
    const target = request.job.httpTarget;
    assert.equal(target.headers["content-type"], "application/json");
    assert.deepEqual(JSON.parse(target.body.toString()), {
      a: 1,
      message: "hello 🌱",
      active: false,
    });
    assert.deepEqual(target.oauthToken, token);
    const message =
      protos.google.cloud.scheduler.v1.HttpTarget.fromObject(target);
    assert.equal(
      protos.google.cloud.scheduler.v1.HttpTarget.verify(message),
      null,
    );
    assert.equal(
      message.oauthToken.serviceAccountEmail,
      token.serviceAccountEmail,
    );
    const { CreateJobRequest, HttpMethod } = protos.google.cloud.scheduler.v1;
    const wire = CreateJobRequest.fromObject(request);
    assert.equal(CreateJobRequest.verify(wire), null);
    const decoded = CreateJobRequest.decode(
      CreateJobRequest.encode(wire).finish(),
    );
    assert.equal(decoded.parent, "projects/dummy/locations/us-east1");
    assert.equal(decoded.job.schedule, "* * * * *");
    assert.equal(decoded.job.httpTarget.uri, uri);
    assert.equal(decoded.job.httpTarget.httpMethod, HttpMethod.POST);
    assert.equal(
      decoded.job.httpTarget.headers["content-type"],
      "application/json",
    );
    assert.deepEqual(JSON.parse(decoded.job.httpTarget.body.toString()), {
      a: 1,
      message: "hello 🌱",
      active: false,
    });
    assert.equal(
      decoded.job.httpTarget.oauthToken.serviceAccountEmail,
      token.serviceAccountEmail,
    );
  });
});
