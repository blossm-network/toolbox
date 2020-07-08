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
    const uri = "some-proof-uri";
    const type = "some-proof-type";

    const proofs = [
      {
        metadata,
        id,
        uri,
        type,
      },
    ];
    const saveProofFnResult = await saveProofs({ proofsStore })(proofs);
    expect(saveProofFnResult).to.be.undefined;
    expect(createFake).to.have.been.calledWith({
      store: proofsStore,
      data: [
        {
          uri,
          type,
          id,
          created: deps.dateString(),
          updated: deps.dateString(),
          metadata,
        },
      ],
    });
  });
});
