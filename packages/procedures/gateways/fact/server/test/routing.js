import { expect } from "chai";
import { replace, restore } from "sinon";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import serverDeps from "../../../../server/deps.js";
import gateway from "../index.js";
import deps from "../deps.js";

describe("Fact gateway stream routing", () => {
  afterEach(restore);

  it("dispatches streams with and without a root before ordinary reads", async () => {
    const app = serverDeps.express();
    let selected;
    const builder = {
      get: (handler, { path }) => {
        app.get(path, handler);
        return builder;
      },
      listen: () => {},
    };
    replace(deps, "server", () => builder);
    replace(deps, "get", ({ stream }) => (req) => {
      selected = { stream, root: req.params.root };
    });
    await gateway({ facts: [{ name: "balance", protection: "none" }] });

    for (const [url, expected] of [
      ["/balance/stream", { stream: true, root: undefined }],
      ["/balance/stream/root", { stream: true, root: "root" }],
      ["/balance/root", { stream: false, root: "root" }],
      ["/balance", { stream: false, root: undefined }],
    ]) {
      const socket = new Duplex({ read() {}, write(_, __, done) { done(); } });
      const req = new IncomingMessage(socket);
      req.method = "GET";
      req.url = url;
      app.handle(req, new ServerResponse(req), () => {});
      expect(selected).to.deep.equal(expected);
      socket.destroy();
    }
  });
});
