import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import saveBlock from "../index.js";

import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

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
      options: {
        session: transaction,
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
      },
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
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
      },
    });
    expect(result).to.deep.equal(writeResult);
  });
});
