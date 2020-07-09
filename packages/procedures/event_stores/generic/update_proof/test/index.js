const { expect } = require("chai").use(require("sinon-chai"));
const { replace, restore, fake } = require("sinon");

const updateProof = require("..");
const deps = require("../deps");

const id = "some-id";
const uri = "some-uri";

describe("Event store update proof", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const proof = "some-proof";
    const getProofFake = fake.returns(proof);
    replace(deps, "getProof", getProofFake);

    const updateProofFnFake = fake();
    const storedProof = { metadata: { uri } };
    const getProofFnFake = fake.returns(storedProof);

    const req = {
      params: {
        id,
      },
    };

    const sendFake = fake();

    const res = {
      send: sendFake,
    };
    await updateProof({
      getProofFn: getProofFnFake,
      updateProofFn: updateProofFnFake,
    })(req, res);

    expect(getProofFake).to.have.been.calledWith({
      id,
      uri,
    });
    expect(updateProofFnFake).to.have.been.calledWith({
      id,
      update: proof,
    });
    expect(sendFake).to.have.been.calledWith();
  });
  it("should call with the correct params if no proof", async () => {
    const getProofFake = fake.returns(null);
    replace(deps, "getProof", getProofFake);

    const updateProofFnFake = fake();
    const storedProof = { metadata: { uri } };
    const getProofFnFake = fake.returns(storedProof);

    const req = {
      params: {
        id,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });

    const res = {
      status: statusFake,
    };
    await updateProof({
      getProofFn: getProofFnFake,
      updateProofFn: updateProofFnFake,
    })(req, res);
    expect(getProofFake).to.have.been.calledWith({
      id,
      uri,
    });
    expect(statusFake).to.have.been.calledWith(204);
    expect(sendFake).to.have.been.calledWith();
  });
  it("should throw a resource not found correctly", async () => {
    const getProofFake = fake.returns(null);
    replace(deps, "getProof", getProofFake);

    const updateProofFnFake = fake();
    const getProofFnFake = fake.returns(null);

    const req = {
      params: {
        id,
      },
    };

    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });

    const res = {
      status: statusFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "resourceNotFoundError", {
      message: messageFake,
    });
    try {
      await updateProof({
        getProofFn: getProofFnFake,
        updateProofFn: updateProofFnFake,
      })(req, res);

      //shouldn't get called.
      expect(1).to.equal(2);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This proof wasn't found.");
      expect(e).to.equal(error);
    }
  });
});
