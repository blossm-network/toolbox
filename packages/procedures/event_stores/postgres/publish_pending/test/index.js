import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import publishPending from "../index.js";
import deps from "../deps.js";

describe("Postgres pending publications", () => {
  afterEach(restore);

  it("uses the shared loop with PostgreSQL operations and the original publication arguments", async () => {
    const drain = fake.resolves();
    replace(deps, "deliverPending", fake.returns(drain));
    const publishFn = fake.resolves();
    expect(
      publishPending({ publicationsStore: "notices", publishFn })
    ).to.equal(drain);
    const options = deps.deliverPending.firstCall.args[0];
    expect(options.store).to.equal("notices");
    expect(options.key).to.equal("hash");
    expect(options.db).to.equal(deps.db);
    const notice = { data: { root: "root" }, topic: "topic" };
    await options.deliverFn(notice);
    expect(publishFn.firstCall.args).to.deep.equal([notice.data, notice.topic]);
  });
});
