import assert from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import stream from "../index.js";
import deps from "../deps.js";

it("passes merged-stream deadlines and cancellation without changing source queries", async () => {
  try {
    const transport = fake.resolves(undefined);
    replace(deps, "streamMany", transport);
    replace(deps, "operationToken", fake.resolves({}));
    replace(deps, "operationUrl", fake.returns("https://fixture.invalid/"));
    const signal = new AbortController().signal;
    const query = { active: "yes" };
    await stream({
      operationNameComponentQueries: [
        { operationNameComponents: ["fixture"], query },
      ],
      fn: () => {},
    })
      .in({})
      .with({ timeout: 120000, signal });
    const [requests, , , options] = transport.firstCall.args;
    assert.equal(options.timeout, 120000);
    assert.equal(options.signal, signal);
    assert.deepEqual(requests, [{ url: "https://fixture.invalid/", query }]);
  } finally {
    restore();
  }
});

it("enforces merged-stream deadlines and caller cancellation through the request owner", async () => {
  try {
    const { default: request } = await import("../../../lib/request/index.js");
    const { default: requestDeps } =
      await import("../../../lib/request/deps.js");
    replace(deps, "streamMany", request.streamMany);
    replace(deps, "operationToken", fake.resolves({}));
    replace(deps, "operationUrl", fake.returns("https://fixture.invalid/"));
    replace(
      requestDeps,
      "fetch",
      (_, { signal }) =>
        new Promise((resolve, reject) => {
          signal.throwIfAborted();
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
    );
    const fn = fake();
    const operation = () =>
      stream({
        operationNameComponentQueries: [
          { operationNameComponents: ["fixture"], query: {} },
        ],
        fn,
      }).in({});
    await assert.rejects(
      operation().with({ timeout: 5 }),
      (error) => error.name === "TimeoutError",
    );
    const failure = new Error("Caller cancelled merged RPC");
    const controller = new AbortController();
    controller.abort(failure);
    await assert.rejects(
      operation().with({ signal: controller.signal }),
      (error) => error === failure,
    );
    assert.equal(fn.callCount, 0);
  } finally {
    restore();
  }
});
