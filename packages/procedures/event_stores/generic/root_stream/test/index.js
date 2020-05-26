const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, match } = require("sinon");

const stream = require("..");

describe("Event store root stream", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const rootStreamFake = fake();

    const req = {
      query: {
        parallel: 2,
      },
    };

    const endFake = fake();
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const res = {
      end: endFake,
      write: writeFake,
    };

    await stream({ rootStreamFn: rootStreamFake })(req, res);
    expect(rootStreamFake).to.have.been.calledWith({
      parallel: 2,
      fn: match((fn) => {
        const root = "some-root";
        const data = { root };
        const result = fn(data);
        return result == writeResult && writeFake.calledWith(root);
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
  it("should call with the correct params and optionals missing", async () => {
    const rootStreamFake = fake();

    const req = {
      query: {},
    };

    const endFake = fake();
    const writeResult = "some-write-result";
    const writeFake = fake.returns(writeResult);
    const res = {
      end: endFake,
      write: writeFake,
    };

    await stream({ rootStreamFn: rootStreamFake })(req, res);
    expect(rootStreamFake).to.have.been.calledWith({
      fn: match((fn) => {
        const root = "some-root";
        const data = { root };
        const result = fn(data);
        return result == writeResult && writeFake.calledWith(root);
      }),
    });
    expect(endFake).to.have.been.calledWith();
  });
});
