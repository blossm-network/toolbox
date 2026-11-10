import { expect } from "chai";
import { replace, restore } from "sinon";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import serverDeps from "../../../../server/deps.js";
import gateway from "../index.js";
import deps from "../deps.js";

describe("Fact gateway stream routing", () => {
  afterEach(restore);

  for (const protection of ["none", "strict"]) {
    it(`dispatches ${protection} streams before ordinary reads with the configured middleware`, async () => {
      const app = serverDeps.express();
      let selected;
      const middleware = [];
      const builder = {
        get: (handler, { path, preMiddleware = [] }) => {
          app.get(path, ...preMiddleware, handler);
          return builder;
        },
        listen: () => {},
      };
      replace(deps, "server", () => builder);
      replace(deps, "get", ({ stream }) => (req) => {
        selected = { stream, root: req.params.root };
      });
      replace(deps, "authentication", () => (_, __, next) => {
        middleware.push("authentication");
        next();
      });
      replace(deps, "authorization", () => (_, __, next) => {
        middleware.push("authorization");
        next();
      });
      await gateway({
        facts: [{ name: "balance", protection }],
        verifyFn: () => undefined,
      });

      for (const [url, expected] of [
        ["/balance/stream", { stream: true, root: undefined }],
        ["/balance/stream/root", { stream: true, root: "root" }],
        ["/balance/root", { stream: false, root: "root" }],
        ["/balance", { stream: false, root: undefined }],
      ]) {
        selected = undefined;
        middleware.length = 0;
        const socket = new Duplex({
          read() {},
          write(_, __, done) {
            done();
          },
        });
        const req = new IncomingMessage(socket);
        req.method = "GET";
        req.url = url;
        app.handle(req, new ServerResponse(req), () => {});
        expect(selected).to.deep.equal(expected);
        expect(middleware).to.deep.equal(
          protection === "strict" ? ["authentication", "authorization"] : [],
        );
        socket.destroy();
      }
    });
  }
});
