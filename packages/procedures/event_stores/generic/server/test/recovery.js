import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import server from "../index.js";
import deps from "../deps.js";

describe("Required durable publication", () => {
  let nodeEnv;
  beforeEach(() => {
    nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const builder = {
      get() {
        return this;
      },
      post() {
        return this;
      },
      listen: fake(),
    };
    replace(deps, "server", fake.returns(builder));
    replace(deps, "post", fake());
    replace(deps, "createBlock", fake());
  });
  afterEach(() => {
    restore();
    if (nodeEnv == undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  });

  it("supplies the required dispatcher to event and scheduled block routes", async () => {
    const publishPendingFn = fake.resolves();
    await server({ publishPendingFn });
    expect(deps.post.firstCall.args[0].publishPendingFn).to.equal(
      publishPendingFn
    );
    expect(deps.createBlock.firstCall.args[0].publishPendingFn).to.equal(
      publishPendingFn
    );
  });

  it("rejects a missing dispatcher before constructing routes or listening", async () => {
    await rejects(server(), /require durable publication/);
    expect(deps.server.callCount).to.equal(0);
    expect(deps.post.callCount).to.equal(0);
    expect(deps.createBlock.callCount).to.equal(0);
  });

  it("allows the explicit local mode without publication", async () => {
    process.env.NODE_ENV = "local";
    await server();
    expect(deps.server.returnValues[0].listen.callCount).to.equal(1);
  });
});
