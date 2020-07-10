const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const getProof = require("..");

const deps = require("../deps");

const proofsStore = "some-proofs-store";
const id = "some-id";
const proof = "some-proof";

describe("Mongodb event store get proof", () => {
  afterEach(() => {
    restore();
  });
  it("should call with the correct params", async () => {
    const findFake = fake.returns([proof]);

    const db = {
      find: findFake,
    };

    replace(deps, "db", db);

    const result = await getProof({ proofsStore })(id);
    expect(findFake).to.have.been.calledWith({
      store: proofsStore,
      query: { id },
      options: {
        lean: true,
      },
    });
    expect(result).to.deep.equal(proof);
  });
});
