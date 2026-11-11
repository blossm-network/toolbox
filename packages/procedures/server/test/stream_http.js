import assert from "node:assert/strict";
import { createServer, get } from "node:http";
import { once } from "node:events";
import { write } from "../index.js";

describe("Native response write boundaries", function () {
  this.timeout(10000);
  for (const disconnect of [false, true]) {
    it(
      disconnect
        ? "rejects a blocked native write after client disconnect"
        : "drains a native response before completing the producer",
      async () => {
        const chunk = Buffer.alloc(16 * 1024 * 1024, 120);
        let next = false,
          failure,
          backpressured = false;
        let finished;
        const done = new Promise((resolve) => {
          finished = resolve;
        });
        const server = createServer(async (req, res) => {
          const nativeWrite = res.write.bind(res);
          res.write = (data) => {
            const result = nativeWrite(data);
            backpressured ||= result === false;
            return result;
          };
          try {
            await write(res, chunk);
            next = true;
            res.end();
          } catch (error) {
            failure = error;
          } finally {
            finished();
          }
        });
        server.listen(0, "127.0.0.1");
        await once(server, "listening");
        let client;
        try {
          await new Promise((resolve, reject) => {
            client = get(
              `http://127.0.0.1:${server.address().port}`,
              (response) => {
                if (disconnect) {
                  response.destroy();
                  try {
                    assert.equal(next, false);
                    resolve();
                  } catch (error) {
                    reject(error);
                  }
                } else {
                  let bytes = 0;
                  response.on("data", (data) => {
                    bytes += data.length;
                  });
                  response.on("error", reject);
                  response.on("end", () => {
                    try {
                      assert.equal(bytes, chunk.length);
                      resolve();
                    } catch (error) {
                      reject(error);
                    }
                  });
                }
              },
            );
            client.on("error", reject);
          });
          await done;
          assert.equal(backpressured, true);
          assert.equal(next, !disconnect);
          if (disconnect) assert.match(failure.message, /closed/);
          else assert.equal(failure, undefined);
        } finally {
          client?.destroy();
          server.closeAllConnections();
          await new Promise((resolve) => server.close(resolve));
        }
      },
    );
  }
});
