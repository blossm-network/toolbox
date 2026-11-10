import assert from "node:assert/strict";
import { once } from "node:events";
import { gzipSync } from "node:zlib";
import createServer from "../index.js";
import deps from "../deps.js";

describe("HTTP dependency compatibility", function () {
  this.timeout(10000);
  it("serves JSON, gzip, cookies and optional routes, and survives malformed JSON", async () => {
    let app;
    const routes = createServer({
      prehook: (value) => {
        app = value;
      },
    });
    routes.post(
      (req, res) => res.json({ body: req.body, cookie: req.cookies.session }),
      { path: "/echo" }
    );
    routes.get((req, res) => res.json({ id: req.params.id || null }), {
      path: "/items/:id?",
    });
    app.use(deps.errorMiddleware);
    const listener = app.listen(0, "127.0.0.1");
    try {
      await once(listener, "listening");
      const origin = `http://127.0.0.1:${listener.address().port}`;
      const payload = { amount: 1, label: "value" };
      for (const compressed of [false, true]) {
        const response = await fetch(origin + "/echo", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: "session=example",
            ...(compressed ? { "content-encoding": "gzip" } : {}),
          },
          body: compressed
            ? gzipSync(JSON.stringify(payload))
            : JSON.stringify(payload),
        });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
          body: payload,
          cookie: "example",
        });
      }
      for (const [path, id] of [
        ["/items", null],
        ["/items/abc", "abc"],
      ]) {
        const response = await fetch(origin + path);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { id });
      }
      const malformed = await fetch(origin + "/echo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      });
      assert.equal(malformed.status, 400);
      assert.equal((await fetch(origin + "/_check-in")).status, 200);
    } finally {
      listener.closeAllConnections();
      await new Promise((resolve, reject) =>
        listener.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
});
