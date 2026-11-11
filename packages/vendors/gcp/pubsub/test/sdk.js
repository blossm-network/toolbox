import assert from "node:assert/strict";
import { replace, restore } from "sinon";
import pubsub from "../index.js";

// Keep the installed SDK's resource methods and event machinery; replace only
// its remote request and streaming transport so no credentials/cloud are used.
describe("Installed PubSub subscription lifecycle", () => {
  let calls;
  let handles;
  let opened;
  let request;
  const metadata = {
    name: "projects/toolbox-offline-verification/subscriptions/fixture",
  };

  beforeEach(() => {
    replace(pubsub.__pubsub, "projectId", "toolbox-offline-verification");
    calls = [];
    handles = [];
    opened = 0;
    request = (_options, callback) => callback(null, metadata);
    replace(pubsub.__pubsub, "request", (options, callback) => {
      calls.push(options);
      request(options, callback);
    });
    const original = pubsub.__pubsub.subscription.bind(pubsub.__pubsub);
    replace(pubsub.__pubsub, "subscription", (...args) => {
      const handle = original(...args);
      handles.push(handle);
      replace(handle._subscriber, "open", () => {
        opened++;
      });
      replace(handle._subscriber, "close", async () => {});
      return handle;
    });
  });
  afterEach(() => {
    restore();
  });

  it("reuses the actual SDK handle, delivers messages and leaves ack/close to its caller", async () => {
    const messages = [];
    const result = await pubsub.subscribe({
      topic: "fixture-topic",
      name: "fixture",
      fn: (message) => messages.push(message),
    });
    assert.equal(result, handles[0]);
    assert.deepEqual(
      calls.map(({ method }) => method),
      ["getSubscription"],
    );
    assert.equal(opened, 1);
    let acknowledged = false;
    const message = {
      ack() {
        acknowledged = true;
      },
    };
    result._subscriber.emit("message", message);
    assert.deepEqual(messages, [message]);
    assert.equal(acknowledged, false);
    messages[0].ack();
    assert.equal(acknowledged, true);
    await result.close();
    assert.equal(calls.length, 1);
  });

  it("awaits actual SDK creation and registers a delivery handler afterward", async () => {
    let finish;
    let creationStarted;
    const started = new Promise((resolve) => {
      creationStarted = resolve;
    });
    request = ({ method }, callback) => {
      if (method === "getSubscription")
        return callback(Object.assign(new Error("missing"), { code: 5 }));
      assert.equal(method, "createSubscription");
      finish = () => callback(null, metadata);
      creationStarted();
    };
    const messages = [];
    let resolved = false;
    const pending = pubsub
      .subscribe({
        topic: "fixture-topic",
        name: "fixture",
        fn: (message) => messages.push(message),
      })
      .then((result) => {
        resolved = true;
        return result;
      });
    await started;
    assert.equal(resolved, false);
    assert.equal(opened, 0);
    assert.equal(handles[0].listenerCount("message"), 0);
    finish();
    const result = await pending;
    assert.equal(result, handles[0]);
    assert.equal(opened, 1);
    assert.deepEqual(
      calls.map(({ method }) => method),
      ["getSubscription", "createSubscription"],
    );
    assert.equal(
      calls[1].reqOpts.topic,
      "projects/toolbox-offline-verification/topics/fixture-topic",
    );
    result._subscriber.emit("message", "fixture-message");
    assert.deepEqual(messages, ["fixture-message"]);
    await result.close();
  });

  for (const failure of ["getSubscription", "createSubscription"]) {
    it(`propagates actual SDK ${failure} rejection without starting delivery`, async () => {
      const error = Object.assign(new Error("denied"), { code: 7 });
      request = ({ method }, callback) =>
        callback(
          method === failure
            ? error
            : Object.assign(new Error("missing"), { code: 5 }),
        );
      await assert.rejects(
        pubsub.subscribe({ topic: "fixture-topic", name: "fixture", fn() {} }),
        (result) => result === error,
      );
      assert.equal(opened, 0);
      assert.equal(handles[0].listenerCount("message"), 0);
    });
  }
});
