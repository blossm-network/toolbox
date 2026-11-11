import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { gzipSync } from "node:zlib";
import request from "../index.js";

const sockets = new Set();
let server, other, base, elsewhere;
const seen = [];
const active = new Map();
const track = (path, res) => {
  const state = {
    res,
    closed: new Promise((resolve) => res.once("close", resolve)),
  };
  active.set(path, state);
  return state;
};
const handle = async (req, res) => {
  seen.push({ url: req.url, headers: req.headers, method: req.method });
  if (req.url.startsWith("/hop/")) {
    const remaining = Number(req.url.split("/").pop());
    if (remaining) res.writeHead(302, { location: `/hop/${remaining - 1}` });
    return res.end(remaining ? "redirect" : "arrived");
  }
  if (req.url.startsWith("/hold/")) {
    track(req.url, res);
    res.write("first");
    return;
  }
  if (req.url.startsWith("/sorted/")) {
    track(req.url, res);
    const first = req.url.endsWith("a") ? 1 : 2;
    res.write(`{"n":${first}}\n{"n":`);
    return;
  }
  if (req.url.startsWith("/merge/")) {
    track(req.url, res);
    if (req.url.endsWith("hold")) res.write("first");
    const hold = active.get("/merge/hold");
    const failed = active.get("/merge/fail");
    if (hold && failed) {
      failed.res.writeHead(503);
      failed.res.end('{"message":"source unavailable"}');
    }
    return;
  }
  if (req.url === "/slow-upload") {
    const state = track(req.url, res);
    state.bytes = 0;
    state.complete = false;
    req.on("error", () => {});
    let timer;
    const onData = (chunk) => {
      state.bytes += chunk.length;
      req.pause();
      timer = setTimeout(() => req.resume(), 100);
    };
    req.on("data", onData);
    res.once("close", () => clearTimeout(timer));
    state.resume = () => {
      clearTimeout(timer);
      req.removeListener("data", onData);
      req.resume();
    };
    req.on("end", () => {
      state.complete = true;
      res.end("uploaded");
    });
    return;
  }
  if (req.url.startsWith("/redirect")) {
    res.writeHead(302, {
      location: req.url.includes("other") ? `${elsewhere}/echo` : "/echo",
    });
    return res.end();
  }
  if (req.url === "/slow") {
    return setTimeout(() => res.end("late"), 100);
  }
  if (req.url === "/idle") {
    res.writeHead(200);
    res.write("first");
    return setTimeout(() => res.end("late"), 100);
  }
  if (req.url === "/gzip") {
    const body = gzipSync(Buffer.from("decoded representation"));
    res.writeHead(200, {
      "content-type": "text/plain",
      "content-encoding": "gzip",
      "content-length": body.length,
    });
    return res.end(body);
  }
  if (req.url === "/forbidden") {
    res.writeHead(403, { "content-type": "application/json" });
    return res.end(
      JSON.stringify({ code: "Forbidden", message: "Not permitted." }),
    );
  }
  if (req.url === "/stream") {
    res.writeHead(200, {
      "content-type": "application/x-ndjson",
      "x-stream": "yes",
    });
    res.write("first");
    return setTimeout(() => res.end("second"), 20);
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: Buffer.concat(chunks).toString(),
    }),
  );
};

describe("Native HTTP transport boundaries", () => {
  before(async () => {
    server = createServer(handle);
    other = createServer(handle);
    for (const instance of [server, other]) {
      instance.on("connection", (socket) => {
        sockets.add(socket);
        socket.once("close", () => sockets.delete(socket));
      });
      instance.listen(0, "127.0.0.1");
      await once(instance, "listening");
    }
    base = `http://127.0.0.1:${server.address().port}`;
    elsewhere = `http://127.0.0.1:${other.address().port}`;
  });
  afterEach(() => {
    for (const state of active.values()) state.res.destroy();
    active.clear();
  });
  after(async () => {
    for (const socket of sockets) socket.destroy();
    await Promise.all(
      [server, other].map(
        (instance) => new Promise((resolve) => instance.close(resolve)),
      ),
    );
  });

  it("preserves JSON writes, raw GET text, query encoding and response metadata", async () => {
    const post = await request.post(`${base}/echo`, {
      body: { hello: "world" },
      headers: { "x-test": "yes" },
    });
    assert.equal(post.statusCode, 200);
    assert.equal(post.body.body, '{"hello":"world"}');
    assert.equal(post.body.headers["x-test"], "yes");
    const get = await request.get(`${base}/echo`, {
      query: { nested: { active: true } },
    });
    assert.equal(typeof get.body, "string");
    assert.match(JSON.parse(get.body).url, /nested%5Bactive%5D=true/);
    assert.equal(get.headers["content-type"], "application/json");
    const put = await request.put(`${base}/echo`, { body: { updated: true } });
    assert.equal(put.body.method, "PUT");
    const del = await request.del(`${base}/echo`, { query: { id: "row" } });
    assert.equal(JSON.parse(del.body).method, "DELETE");
  });

  it("sends appended queries before fragments through GET, DELETE and streams", async () => {
    const url = `${base}/echo?old=1#section?ignored=1`;
    const options = { query: { fresh: "a#b" } };
    for (const method of ["get", "del"]) {
      const result = await request[method](url, options);
      assert.equal(JSON.parse(result.body).url, "/echo?old=1&fresh=a%23b");
    }
    let body = "";
    await request.stream(
      url,
      (chunk) => {
        body += chunk.toString();
      },
      options,
    );
    assert.equal(JSON.parse(body).url, "/echo?old=1&fresh=a%23b");
  });

  it("returns ordinary HTTP failures but rejects streaming failures before callbacks", async () => {
    const response = await request.get(`${base}/forbidden`);
    assert.equal(response.statusCode, 403);
    let calls = 0;
    await assert.rejects(
      request.stream(`${base}/forbidden`, () => calls++),
      (err) => err.statusCode === 403 && err.message === "Not permitted.",
    );
    assert.equal(calls, 0);
  });

  it("delivers headers before bytes and awaits each callback", async () => {
    const events = [];
    let active = 0;
    await request.stream(
      `${base}/stream`,
      async (data) => {
        active++;
        assert.equal(active, 1);
        events.push(data.toString());
        await new Promise((resolve) => setTimeout(resolve, 30));
        active--;
      },
      { onResponseFn: (response) => events.push(response.headers["x-stream"]) },
    );
    assert.equal(events[0], "yes");
    assert.equal(events.slice(1).join(""), "firstsecond");
  });

  it("cancels the stream on callback failure", async () => {
    const failure = new Error("callback failed");
    let calls = 0;
    await assert.rejects(
      request.stream(`${base}/stream`, () => {
        calls++;
        throw failure;
      }),
      (err) => err === failure,
    );
    await new Promise((resolve) => setTimeout(resolve, 35));
    assert.equal(calls, 1);
  });

  it("enforces request and stream idle timeouts", async () => {
    await assert.rejects(
      request.get(`${base}/slow`, { timeout: 10 }),
      (err) => err.name === "TimeoutError",
    );
    await assert.rejects(
      request.stream(`${base}/idle`, () => undefined, { timeout: 10 }),
      (err) => err.name === "TimeoutError",
    );
  });

  it("supports caller cancellation before a request starts", async () => {
    const controller = new AbortController();
    controller.abort(new Error("cancelled"));
    await assert.rejects(
      request.get(`${base}/echo`, { signal: controller.signal }),
      /cancelled/,
    );
  });

  it("retains same-origin credentials and strips them across a redirect", async () => {
    const headers = { authorization: "Bearer fake", cookie: "access=fake" };
    const same = JSON.parse(
      (await request.get(`${base}/redirect`, { headers })).body,
    );
    assert.equal(same.headers.authorization, headers.authorization);
    const cross = JSON.parse(
      (await request.get(`${base}/redirect-other`, { headers })).body,
    );
    assert.equal(cross.headers.authorization, undefined);
    assert.equal(cross.headers.cookie, undefined);
    const post = await request.post(`${base}/redirect`, {
      body: { command: true },
    });
    assert.equal(post.statusCode, 302);
  });

  it("encodes multipart fields and file streams using native FormData", async () => {
    const result = await request.post(`${base}/echo`, {
      formData: {
        title: "example",
        file: {
          value: createReadStream(new URL("../README.md", import.meta.url)),
          options: { filename: "guide.txt", contentType: "text/plain" },
        },
      },
    });
    const echoed = JSON.parse(result.body);
    assert.match(
      echoed.headers["content-type"],
      /^multipart\/form-data; boundary=/,
    );
    assert.match(echoed.body, /name="title"\r\n\r\nexample/);
    assert.match(echoed.body, /filename="guide.txt"/);
    assert.match(echoed.body, /Http access|HTTP access/);
  });

  it("reports decoded bytes without stale compressed length or encoding", async () => {
    const reply = await request.get(`${base}/gzip`);
    assert.equal(reply.body, "decoded representation");
    assert.equal(reply.headers["content-encoding"], undefined);
    assert.equal(reply.headers["content-length"], undefined);
    let metadata;
    const chunks = [];
    await request.stream(`${base}/gzip`, (chunk) => chunks.push(chunk), {
      onResponseFn: (value) => {
        metadata = value;
      },
    });
    assert.equal(Buffer.concat(chunks).toString(), "decoded representation");
    assert.equal(metadata.headers["content-encoding"], undefined);
    assert.equal(metadata.headers["content-length"], undefined);
    assert.equal(metadata.headers["content-type"], "text/plain");
  });

  it("aborts a response midway and closes the server response", async () => {
    const controller = new AbortController();
    const failure = new Error("cancel receiving");
    let calls = 0;
    let closed;
    await assert.rejects(
      request.stream(
        `${base}/hold/abort`,
        () => {
          calls++;
          closed = active.get("/hold/abort").closed;
          controller.abort(failure);
        },
        { signal: controller.signal },
      ),
      (error) => error === failure,
    );
    assert.equal(calls, 1);
    await closed;
  });

  it("rejects an abruptly disconnected response without later callbacks", async () => {
    let calls = 0;
    await assert.rejects(
      request.stream(`${base}/hold/reset`, () => {
        calls++;
        active.get("/hold/reset").res.destroy();
      }),
      (error) => error instanceof Error,
    );
    assert.equal(calls, 1);
    await active.get("/hold/reset").closed;
  });

  it("closes a response when the metadata callback fails before body iteration", async () => {
    const failure = new Error("cannot accept response");
    let calls = 0;
    await assert.rejects(
      request.stream(`${base}/hold/metadata`, () => calls++, {
        onResponseFn: () => {
          throw failure;
        },
      }),
      (error) => error === failure,
    );
    assert.equal(calls, 0);
    await active.get("/hold/metadata").closed;
  });

  it("merges actual HTTP sources with independent fragmented records", async () => {
    let decoders = 0;
    const decode = () => {
      decoders++;
      let pending = "";
      return {
        write: (chunk) => {
          const lines = (pending + chunk.toString()).split("\n");
          pending = lines.pop();
          return lines.map((line) => JSON.parse(line));
        },
        end: () => {
          assert.equal(pending, "");
          return [];
        },
      };
    };
    const output = [];
    await request.streamMany(
      [{ url: `${base}/sorted/a` }, { url: `${base}/sorted/b` }],
      async ({ n }) => {
        output.push(n);
        if (n <= 2)
          active.get(`/sorted/${n === 1 ? "a" : "b"}`).res.end(`${n + 2}}\n`);
      },
      (a, b) => a.n - b.n,
      { decode },
    );
    assert.deepEqual(output, [1, 2, 3, 4]);
    assert.equal(decoders, 2);
  });

  it("cancels the other actual source when one returns an HTTP failure", async () => {
    let calls = 0;
    await assert.rejects(
      request.streamMany(
        [{ url: `${base}/merge/hold` }, { url: `${base}/merge/fail` }],
        () => calls++,
      ),
      (error) =>
        error.statusCode === 503 && error.message === "source unavailable",
    );
    assert.equal(calls, 0);
    await active.get("/merge/hold").closed;
  });

  it("closes every actual source when the output callback fails", async () => {
    const failure = new Error("cannot process merged output");
    let calls = 0;
    await assert.rejects(
      request.streamMany(
        [{ url: `${base}/hold/first` }, { url: `${base}/hold/second` }],
        async () => {
          calls++;
          throw failure;
        },
      ),
      (error) => error === failure,
    );
    assert.equal(calls, 1);
    await Promise.all([
      active.get("/hold/first").closed,
      active.get("/hold/second").closed,
    ]);
  });

  it("follows five redirects and stops before a sixth hop", async () => {
    assert.equal((await request.get(`${base}/hop/5`)).body, "arrived");
    const before = seen.length;
    await assert.rejects(
      request.get(`${base}/hop/6`),
      /exceeded five redirects/,
    );
    assert.deepEqual(
      seen.slice(before).map(({ url }) => url),
      ["/hop/6", "/hop/5", "/hop/4", "/hop/3", "/hop/2", "/hop/1"],
    );
  });

  it("times out while the server is still receiving a progressing upload", async () => {
    await assert.rejects(
      request.post(`${base}/slow-upload`, {
        body: { data: "x".repeat(4 * 1024 * 1024) },
        timeout: 400,
      }),
      (error) => error.name === "TimeoutError",
    );
    const upload = active.get("/slow-upload");
    assert.ok(upload.bytes > 0);
    assert.equal(upload.complete, false);
    // Resume the paused server reader so it can observe the client's disconnect.
    upload.resume();
    await upload.closed;
  });

  it("completes an empty stream list", async () => {
    let calls = 0;
    await request.streamMany([], () => calls++);
    assert.equal(calls, 0);
  });
});
