import assert from "node:assert/strict";
import { protos } from "@google-cloud/tasks";
import { replace, restore } from "sinon";
import queue from "../index.js";

describe("Installed Tasks HTTP request contract", () => {
  afterEach(restore);
  it("serializes the adapter's OIDC task with the installed protobuf schema", async () => {
    let request;
    replace(queue.__client, "createTask", async (value) => {
      request = value;
      return [{ name: "task" }];
    });
    assert.deepEqual(
      await queue.enqueue({
        project: "offline",
        location: "region",
        queue: "commands",
      })({
        url: "https://example.invalid/run",
        data: { active: false, count: 0 },
      }),
      { name: "task" },
    );
    const { CreateTaskRequest, HttpMethod } = protos.google.cloud.tasks.v2;
    const message = CreateTaskRequest.fromObject(request);
    assert.equal(CreateTaskRequest.verify(message), null);
    const decoded = CreateTaskRequest.decode(
      CreateTaskRequest.encode(message).finish(),
    );
    assert.equal(
      decoded.parent,
      "projects/offline/locations/region/queues/commands",
    );
    assert.equal(decoded.task.httpRequest.httpMethod, HttpMethod.POST);
    assert.deepEqual(JSON.parse(decoded.task.httpRequest.body.toString()), {
      active: false,
      count: 0,
    });
    assert.equal(
      decoded.task.httpRequest.oidcToken.audience,
      "https://example.invalid",
    );
  });
});
