const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const count = require("..");

const root = "some-root";
const result = "some-result";

describe("Event store root count", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const rootCountFake = fake.returns(result);

    const req = {
      params: {
        root,
      },
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    await count({ rootCountFn: rootCountFake })(req, res);
    expect(rootCountFake).to.have.been.calledWith({
      root,
    });
    expect(sendFake).to.have.been.calledWith(result);
  });
});
