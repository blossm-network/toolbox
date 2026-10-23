import assert from "node:assert/strict";
import { replace, restore } from "sinon";
import deps from "../deps.js";
import request from "../index.js";

const response = (body = "ok", init = {}) =>
  new Response(body, { status: 200, ...init });

describe("Request", () => {
  afterEach(restore);

  it("writes JSON and preserves returned JSON objects and headers", async () => {
    replace(deps, "fetch", async (url, options) => {
      assert.equal(url.toString(), "https://example.invalid/");
      assert.equal(options.method, "POST");
      assert.equal(options.body, '{"a":1}');
      assert.equal(options.headers.get("authorization"), "Bearer fake");
      assert.equal(options.headers.get("content-type"), "application/json");
      return response('{"accepted":true}', { headers: { "x-result": "yes" } });
    });
    const result = await request.post("example.invalid", {
      body: { a: 1 },
      headers: { authorization: "Bearer fake" },
    });
    assert.deepEqual(result.body, { accepted: true });
    assert.equal(result.headers["x-result"], "yes");
  });

  it("adds the local HTTP scheme when no protocol is supplied", async () => {
    const prior = process.env.NODE_ENV;
    process.env.NODE_ENV = "local";
    try {
      replace(deps, "fetch", async (url) => {
        assert.equal(url.toString(), "http://example.invalid/");
        return response();
      });
      assert.equal((await request.get("example.invalid")).body, "ok");
    } finally {
      if (prior === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prior;
    }
  });

  it("preserves non-JSON responses to JSON writes", async () => {
    replace(deps, "fetch", async () => response("plain reply"));
    assert.equal(
      (await request.put("https://example.invalid", { body: {} })).body,
      "plain reply"
    );
  });

  it("returns upstream failure status and parsed JSON without throwing for ordinary writes", async () => {
    replace(deps, "fetch", async () =>
      response('{"message":"conflict"}', { status: 409 })
    );
    const result = await request.post("https://example.invalid", { body: {} });
    assert.equal(result.statusCode, 409);
    assert.deepEqual(result.body, { message: "conflict" });
  });

  it("passes network failures back without inventing HTTP responses", async () => {
    const failure = new Error("offline");
    replace(deps, "fetch", async () => {
      throw failure;
    });
    await assert.rejects(
      request.get("https://example.invalid"),
      (err) => err === failure
    );
  });

  it("preserves caller content-type and supports empty response bodies", async () => {
    replace(deps, "fetch", async (_, options) => {
      assert.equal(
        options.headers.get("content-type"),
        "application/custom+json"
      );
      return new Response(null, { status: 204 });
    });
    assert.equal(
      (
        await request.post("https://example.invalid", {
          body: {},
          headers: { "Content-Type": "application/custom+json" },
        })
      ).body,
      ""
    );
  });

  it("encodes binary multipart values and rejects conflicting body encodings", async () => {
    replace(deps, "fetch", async (_, options) => {
      assert.ok(options.body instanceof FormData);
      assert.equal(await options.body.get("file").text(), "bytes");
      assert.equal(options.body.get("file").name, "example.bin");
      return response();
    });
    await request.post("https://example.invalid", {
      formData: {
        file: {
          value: Buffer.from("bytes"),
          options: { filename: "example.bin" },
        },
      },
    });
    await assert.rejects(
      request.post("https://example.invalid", { body: {}, formData: {} }),
      TypeError
    );
  });

  it("rejects streaming HTTP errors before invoking metadata or data callbacks", async () => {
    replace(deps, "fetch", async () =>
      response('{"message":"busy"}', { status: 429 })
    );
    let calls = 0;
    await assert.rejects(
      request.stream("https://example.invalid", () => calls++, {
        onResponseFn: () => calls++,
      }),
      (err) => err.statusCode === 429 && err.message === "busy"
    );
    assert.equal(calls, 0);
  });

  it("does not request a URL for an empty stream list", async () => {
    replace(deps, "fetch", async () => {
      throw new Error("unexpected request");
    });
    await request.streamMany([], () => {
      throw new Error("unexpected callback");
    });
  });
});

describe("Merged HTTP streams", () => {
  afterEach(restore);

  const lineDecoder = () => {
    let pending = "";
    return {
      write: (chunk) => {
        const lines = (pending + chunk.toString()).split("\n");
        pending = lines.pop();
        return lines.map((line) => JSON.parse(line));
      },
      end: () => (pending ? [JSON.parse(pending)] : []),
    };
  };

  it("decodes each source before sorted merging, retaining independent partial records", async () => {
    replace(deps, "fetch", async (url) => {
      const parts =
        url.pathname === "/a"
          ? ['{"n":1}\n{"n":', "3}\n"]
          : ['{"n":2}\n{"n":', "4}\n"];
      return response(
        new ReadableStream({
          start(controller) {
            for (const part of parts) controller.enqueue(Buffer.from(part));
            controller.close();
          },
        })
      );
    });
    const output = [];
    await request.streamMany(
      [
        { url: "https://example.invalid/a" },
        { url: "https://example.invalid/b" },
      ],
      (record) => output.push(record.n),
      (a, b) => a.n - b.n,
      { decode: lineDecoder }
    );
    assert.deepEqual(output, [1, 2, 3, 4]);
  });

  it("cancels every source when an output callback fails", async () => {
    let cancelled = 0;
    replace(deps, "fetch", async () =>
      response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(Buffer.from("first"));
          },
          cancel() {
            cancelled++;
          },
        })
      )
    );
    const failure = new Error("stop processing");
    await assert.rejects(
      request.streamMany(
        [
          { url: "https://example.invalid/a" },
          { url: "https://example.invalid/b" },
        ],
        () => {
          throw failure;
        }
      ),
      (err) => err === failure
    );
    assert.equal(cancelled, 2);
  });

  it("cancels a pending source when another source cannot open", async () => {
    let cancelled = false;
    replace(deps, "fetch", async (url, { signal }) => {
      if (url.pathname === "/a") throw new Error("source unavailable");
      return new Promise((resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            cancelled = true;
            reject(signal.reason);
          },
          { once: true }
        );
      });
    });
    await assert.rejects(
      request.streamMany(
        [
          { url: "https://example.invalid/a" },
          { url: "https://example.invalid/b" },
        ],
        () => undefined
      ),
      /source unavailable/
    );
    assert.ok(cancelled);
  });
});

describe("Native transport compatibility", () => {
  afterEach(restore);

  it("preserves every Set-Cookie response header separately", async () => {
    replace(
      deps,
      "fetch",
      async () =>
        new Response("ok", {
          headers: [
            ["set-cookie", "access=a; Path=/"],
            ["set-cookie", "challenge=b; Path=/"],
          ],
        })
    );
    const result = await request.get("https://example.invalid");
    assert.deepEqual(result.headers["set-cookie"], [
      "access=a; Path=/",
      "challenge=b; Path=/",
    ]);
  });

  it("uploads only the selected file stream range", async () => {
    const { createReadStream } = await import("node:fs");
    const { readFile } = await import("node:fs/promises");
    const file = new URL("../README.md", import.meta.url);
    const bytes = await readFile(file);
    replace(deps, "fetch", async (_, options) => {
      assert.deepEqual(
        Buffer.from(await options.body.get("file").arrayBuffer()),
        bytes.subarray(3, 9)
      );
      return response();
    });
    await request.post("https://example.invalid", {
      formData: { file: createReadStream(file, { start: 3, end: 8 }) },
    });
  });

  it("honors an existing file descriptor instead of reopening a named path", async () => {
    const { createReadStream } = await import("node:fs");
    const { open, readFile } = await import("node:fs/promises");
    const file = new URL("../README.md", import.meta.url);
    const bytes = await readFile(file);
    const descriptor = await open(file);
    try {
      replace(deps, "fetch", async (_, options) => {
        assert.deepEqual(
          Buffer.from(await options.body.get("file").arrayBuffer()),
          bytes.subarray(2, 7)
        );
        return response();
      });
      await request.post("https://example.invalid", {
        formData: {
          file: {
            value: createReadStream(file, {
              fd: descriptor.fd,
              autoClose: false,
              start: 2,
              end: 6,
            }),
            options: { filename: "range.txt", contentType: "text/plain" },
          },
        },
      });
    } finally {
      await descriptor.close();
    }
  });

  it("cancels a multipart preparation before reading a pre-aborted stream", async () => {
    const { Readable } = await import("node:stream");
    const input = new Readable({ read() {} });
    const controller = new AbortController();
    const failure = new Error("cancel preparation");
    controller.abort(failure);
    const pending = request
      .post("https://example.invalid", {
        formData: { file: input },
        signal: controller.signal,
      })
      .catch((error) => error);
    const stalled = Symbol("stalled");
    const outcome = await Promise.race([
      pending,
      new Promise((resolve) => setTimeout(() => resolve(stalled), 25)),
    ]);
    input.destroy();
    assert.notEqual(outcome, stalled);
    assert.equal(outcome, failure);
  });

  it("times out and destroys a stalled multipart input", async () => {
    const { Readable } = await import("node:stream");
    const input = new Readable({ read() {} });
    const pending = request
      .post("https://example.invalid", {
        formData: { file: input },
        timeout: 10,
      })
      .catch((error) => error);
    const stalled = Symbol("stalled");
    const outcome = await Promise.race([
      pending,
      new Promise((resolve) => setTimeout(() => resolve(stalled), 40)),
    ]);
    input.destroy();
    assert.notEqual(outcome, stalled);
    assert.equal(outcome.name, "TimeoutError");
    assert.ok(input.destroyed);
  });
});

describe("Merged cancellation signals", () => {
  afterEach(restore);

  it("honors global cancellation even when a source has its own signal", async () => {
    replace(
      deps,
      "fetch",
      async (_, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        })
    );
    const global = new AbortController();
    const source = new AbortController();
    const failure = new Error("cancel all sources");
    const pending = request
      .streamMany(
        [{ url: "https://example.invalid", signal: source.signal }],
        () => undefined,
        undefined,
        { signal: global.signal }
      )
      .catch((error) => error);
    global.abort(failure);
    const stalled = Symbol("stalled");
    const outcome = await Promise.race([
      pending,
      new Promise((resolve) => setTimeout(() => resolve(stalled), 25)),
    ]);
    source.abort(failure);
    assert.notEqual(outcome, stalled);
    assert.equal(outcome, failure);
  });
});
