const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake } = require("sinon");

const getProof = require("..");

const deps = require("../deps");

const blockchainStore = "some-blockchain-store";
const block = "some-block";

describe("Mongodb event store get block", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findOneFake = fake.returns(block);

    const db = {
      findOne: findOneFake,
    };

    replace(deps, "db", db);

    const result = await getProof({ blockchainStore })();
    expect(findOneFake).to.have.been.calledWith({
      store: blockchainStore,
      query: {},
      sort: {
        "headers.number": -1,
      },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(block);
  });
});
