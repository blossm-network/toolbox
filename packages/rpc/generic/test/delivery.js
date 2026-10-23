import assert from "node:assert/strict";
import { expect } from "chai";
import { fake, replace, restore, stub } from "sinon";

import operation from "../index.js";
import deps from "../deps.js";

const outcomes = ["committed", "duplicate"];
const response = {
  statusCode: 200,
  body: JSON.stringify({ outcomes }),
};

const post = (options) =>
  operation({ region: "test", operationNameComponents: ["test"] })
    .post({ eventData: [] })
    .in({})
    .with(options);

describe("RPC delivery outcomes", () => {
  let nodeEnv;
  let host;

  beforeEach(() => {
    nodeEnv = process.env.NODE_ENV;
    host = process.env.HOST;
    process.env.NODE_ENV = "test";
    process.env.HOST = "test";
    replace(deps, "operationToken", fake.resolves({}));
    replace(deps, "operationUrl", fake.returns("https://test.invalid"));
    replace(deps, "operationShortName", fake.returns("test"));
    replace(deps, "hash", fake.returns("test"));
    replace(deps, "post", stub().resolves(response));
  });

  afterEach(() => {
    restore();
    if (nodeEnv == undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    if (host == undefined) delete process.env.HOST;
    else process.env.HOST = host;
  });

  it("preserves the HTTP body and marks completed delivery when requested", async () => {
    expect(await post({ includeDelivery: true })).to.deep.equal({
      statusCode: 200,
      body: { outcomes },
      delivery: "completed",
    });
  });

  it("reports queued only after the queue accepts the task", async () => {
    let accept;
    replace(
      deps,
      "enqueueOperation",
      fake.returns(new Promise((resolve) => (accept = resolve)))
    );
    let settled = false;
    const result = post({ includeDelivery: true, enqueueFn: fake() }).then(
      (value) => {
        settled = true;
        return value;
      }
    );
    await new Promise(setImmediate);
    expect(settled).to.equal(false);
    accept({ name: "accepted-task" });
    expect(await result).to.deep.equal({ delivery: "queued" });
    expect(deps.post.callCount).to.equal(0);
  });

  it("preserves HTTP outcomes when the local environment bypasses the queue", async () => {
    process.env.NODE_ENV = "local";
    replace(
      deps,
      "enqueueOperation",
      fake.rejects(new Error("must not queue"))
    );
    expect(
      await post({ includeDelivery: true, enqueueFn: fake() })
    ).to.deep.equal({
      statusCode: 200,
      body: { outcomes },
      delivery: "completed",
    });
    expect(deps.enqueueOperation.callCount).to.equal(0);
  });

  it("distinguishes queue acceptance without a body from a missing HTTP response", async () => {
    replace(deps, "enqueueOperation", fake.resolves(undefined));
    expect(
      await post({ includeDelivery: true, enqueueFn: fake() })
    ).to.deep.equal({ delivery: "queued" });
    deps.post.resolves(undefined);
    expect(await post({ includeDelivery: true })).to.equal(undefined);
  });

  it("propagates a queue failure without reporting acceptance", async () => {
    const error = new Error("queue unavailable");
    replace(deps, "enqueueOperation", fake.rejects(error));
    await assert.rejects(
      post({ includeDelivery: true, enqueueFn: fake() }),
      (received) => received === error
    );
  });

  it("propagates an HTTP failure without reporting completion", async () => {
    const error = new Error("HTTP unavailable");
    deps.post.rejects(error);
    await assert.rejects(post({ includeDelivery: true }), (e) => e === error);
  });

  it("propagates HTTP error responses through the existing error constructor", async () => {
    const error = new Error("precondition failed");
    deps.post.resolves({ statusCode: 412, body: '{"message":"stale"}' });
    replace(deps, "constructError", fake.returns(error));
    await assert.rejects(post({ includeDelivery: true }), (e) => e === error);
    expect(deps.constructError.firstCall.args[0].statusCode).to.equal(412);
  });

  it("keeps legacy local queue bypass responses unchanged", async () => {
    process.env.NODE_ENV = "local";
    expect(await post({ enqueueFn: fake() })).to.deep.equal({});
  });

  it("keeps legacy HTTP responses free of delivery metadata", async () => {
    expect(await post()).to.deep.equal({ statusCode: 200, body: { outcomes } });
  });
});
