const { expect } = require("chai")
  .use(require("chai-datetime"))
  .use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");

const saveProofs = require("..");

const deps = require("../deps");

let clock;
const now = new Date();

describe("Mongodb event store save proofs", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
    restore();
  });
  it("should call with the correct params", async () => {
    const proofsStore = "some-proofs-store";

    const createFake = fake();

    const db = {
      create: createFake,
    };
    replace(deps, "db", db);

    const metadata = "some-proof-metadata";
    const id = "some-id";
    const type = "some-proof-type";

    const otherMetadata = "some-other-proof-metadata";
    const otherId = "some-other-id";
    const otherType = "some-other-proof-type";

    const proofs = [
      {
        metadata,
        id,
        type,
      },
      {
        metadata: otherMetadata,
        id: otherId,
        type: otherType,
      },
    ];
    const updateProofFnFake = fake();

    const saveProofFnResult = await saveProofs({
      proofsStore,
      updateProofFn: updateProofFnFake,
    })(proofs);

    expect(saveProofFnResult).to.be.undefined;
    expect(updateProofFnFake.getCall(0)).to.have.been.calledWith(id);
    expect(updateProofFnFake.getCall(1)).to.have.been.calledWith(otherId);
    expect(createFake).to.have.been.calledWith({
      store: proofsStore,
      data: [
        {
          type,
          id,
          created: deps.dateString(),
          updated: deps.dateString(),
          metadata,
        },
        {
          type: otherType,
          id: otherId,
          created: deps.dateString(),
          updated: deps.dateString(),
          metadata: otherMetadata,
        },
      ],
    });
  });
});
