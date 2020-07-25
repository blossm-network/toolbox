const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const saveBlock = require("..");

const deps = require("../deps");

const transaction = "some-transaction";
const hash = "some-hash";
const block = {
  hash,
};
const blockchainStore = "some-blockchain-store";

describe("Mongodb event store save block", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const db = {
      write: writeFake,
    };
    replace(deps, "db", db);
    const result = await saveBlock({ blockchainStore })({
      block,
      transaction,
    });
    expect(writeFake).to.have.been.calledWith({
      store: blockchainStore,
      query: {
        hash,
      },
      update: block,
      options: { session: transaction, lean: true },
    });
    expect(result).to.deep.equal(writeResult);
  });
  it("should call with the correct params with optionals omitted", async () => {
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const db = {
      write: writeFake,
    };
    replace(deps, "db", db);
    const result = await saveBlock({ blockchainStore })({
      block,
    });
    expect(writeFake).to.have.been.calledWith({
      store: blockchainStore,
      query: {
        hash,
      },
      update: block,
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(writeResult);
  });
});
