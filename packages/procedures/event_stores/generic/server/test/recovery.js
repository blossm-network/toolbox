import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import server from "../index.js";
import deps from "../deps.js";

describe("Publication recovery composition", () => {
  afterEach(restore);
  it("supplies the same durable dispatcher to event and scheduled block routes", async () => {
    restore();
    const builder = {
      get() {
        return this;
      },
      post() {
        return this;
      },
      listen() {},
    };
    replace(deps, "server", () => builder);
    const post = fake();
    const block = fake();
    replace(deps, "post", post);
    replace(deps, "createBlock", block);
    const publishPendingFn = async () => {};
    await server({ publishPendingFn });
    expect(post.firstCall.args[0].publishPendingFn).to.equal(publishPendingFn);
    expect(block.firstCall.args[0].publishPendingFn).to.equal(publishPendingFn);
  });
});
