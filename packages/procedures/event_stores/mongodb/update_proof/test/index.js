const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const updateProof = require("..");

const deps = require("../deps");

let clock;
const now = new Date();
const id = "some-id";

const update = { a: "some-metadata" };

describe("Mongodb event store update proof", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should call with the correct params", async () => {
    const proofsStore = "some-proofs-store";

    const writeFake = fake();

    const db = {
      write: writeFake,
    };
    replace(deps, "db", db);

    const updateProofFnResult = await updateProof({ proofsStore })({
      id,
      update,
    });
    expect(updateProofFnResult).to.be.undefined;
    expect(writeFake).to.have.been.calledWith({
      store: proofsStore,
      query: { id },
      update: {
        "metadata.a": "some-metadata",
        updated: deps.dateString(),
      },
    });
  });
});
