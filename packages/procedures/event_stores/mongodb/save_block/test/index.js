const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const saveBlock = require("..");

const deps = require("../deps");

const transaction = "some-transaction";
const block = "some-block";
const blockchainStore = "some-blockchain-store";

describe("Mongodb event store save block", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const createResult = "some-create-result";
    const createFake = fake.returns([createResult]);
    const db = {
      create: createFake,
    };
    replace(deps, "db", db);
    const result = await saveBlock({ blockchainStore })({
      block,
      transaction,
    });
    expect(createFake).to.have.been.calledWith({
      store: blockchainStore,
      data: block,
      options: { session: transaction, lean: true },
    });
    expect(result).to.deep.equal(createResult);
  });
  it("should call with the correct params with optionals omitted", async () => {
    const createResult = "some-create-result";
    const createFake = fake.returns([createResult]);
    const db = {
      create: createFake,
    };
    replace(deps, "db", db);
    const result = await saveBlock({ blockchainStore })({
      block,
    });
    expect(createFake).to.have.been.calledWith({
      store: blockchainStore,
      data: block,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(createResult);
  });
});
