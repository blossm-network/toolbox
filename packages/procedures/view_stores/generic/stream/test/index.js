const { expect } = require("chai").use(require("sinon-chai"));
const { match, restore, fake } = require("sinon");

const stream = require("..");

const query = {
  a: 1
};

const writeResult = "some-write-result";

describe("View store stream", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const streamFake = fake();
    const writeFake = fake.returns(writeResult);
    const endFake = fake();
    const res = {
      write: writeFake,
      end: endFake
    };

    const req = {
      query
    };

    await stream({ streamFn: streamFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      query,
      parallel: 1,
      fn: match(fn => {
        const view = { a: 1 };
        const result = fn(view);
        return (
          expect(result).to.equal(writeResult) &&
          expect(writeFake).to.have.been.calledWith(JSON.stringify(view))
        );
      })
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params with fn", async () => {
    const streamFake = fake();
    const writeFake = fake.returns(writeResult);
    const endFake = fake();
    const res = {
      write: writeFake,
      end: endFake
    };

    const req = {
      query
    };

    const sort = "some-sort";
    const fnFake = fake.returns({ query: { b: 2 }, sort, parallel: 2 });
    await stream({ streamFn: streamFake, fn: fnFake })(req, res);
    expect(streamFake).to.have.been.calledWith({
      query: {
        b: 2
      },
      sort,
      parallel: 2,
      fn: match(fn => {
        const view = { a: 1 };
        const result = fn(view);
        return (
          expect(result).to.equal(writeResult) &&
          expect(writeFake).to.have.been.calledWith(JSON.stringify(view))
        );
      })
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should throw correctly", async () => {
    const errorMessage = "some-error";
    const streamFake = fake.throws(new Error(errorMessage));
    const writeFake = fake.returns(writeResult);
    const endFake = fake();
    const res = {
      write: writeFake,
      end: endFake
    };

    const req = {
      query
    };

    try {
      await stream({ streamFn: streamFake })(req, res);

      //shouldn't be called
      expect(2).to.equal(1);
    } catch (e) {
      expect(e.message).to.equal(errorMessage);
    }
  });
});
