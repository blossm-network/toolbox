import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { gzipSync } from "node:zlib";
import request from "../index.js";

const sockets = new Set();
let server, other, base, elsewhere;
const seen = [];
const handle = async (req, res) => {
  seen.push({ url: req.url, headers: req.headers, method: req.method });
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
      JSON.stringify({ code: "Forbidden", message: "Not permitted." })
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
    })
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
  after(async () => {
    for (const socket of sockets) socket.destroy();
    await Promise.all(
      [server, other].map(
        (instance) => new Promise((resolve) => instance.close(resolve))
      )
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

  it("returns ordinary HTTP failures but rejects streaming failures before callbacks", async () => {
    const response = await request.get(`${base}/forbidden`);
    assert.equal(response.statusCode, 403);
    let calls = 0;
    await assert.rejects(
      request.stream(`${base}/forbidden`, () => calls++),
      (err) => err.statusCode === 403 && err.message === "Not permitted."
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
      { onResponseFn: (response) => events.push(response.headers["x-stream"]) }
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
      (err) => err === failure
    );
    await new Promise((resolve) => setTimeout(resolve, 35));
    assert.equal(calls, 1);
  });

  it("enforces request and stream idle timeouts", async () => {
    await assert.rejects(
      request.get(`${base}/slow`, { timeout: 10 }),
      (err) => err.name === "TimeoutError"
    );
    await assert.rejects(
      request.stream(`${base}/idle`, () => undefined, { timeout: 10 }),
      (err) => err.name === "TimeoutError"
    );
  });

  it("supports caller cancellation before a request starts", async () => {
    const controller = new AbortController();
    controller.abort(new Error("cancelled"));
    await assert.rejects(
      request.get(`${base}/echo`, { signal: controller.signal }),
      /cancelled/
    );
  });

  it("retains same-origin credentials and strips them across a redirect", async () => {
    const headers = { authorization: "Bearer fake", cookie: "access=fake" };
    const same = JSON.parse(
      (await request.get(`${base}/redirect`, { headers })).body
    );
    assert.equal(same.headers.authorization, headers.authorization);
    const cross = JSON.parse(
      (await request.get(`${base}/redirect-other`, { headers })).body
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
      /^multipart\/form-data; boundary=/
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

  it("completes an empty stream list", async () => {
    let calls = 0;
    await request.streamMany([], () => calls++);
    assert.equal(calls, 0);
  });
});
