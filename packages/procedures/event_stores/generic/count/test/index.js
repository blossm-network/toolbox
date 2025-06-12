const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, fake } = require("sinon");

const count = require("..");

const root = "some-root";
const result = "some-result";

describe("Event store root count", () => {
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const countFake = fake.returns(result);

    const req = {
      params: {
        root,
      },
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    await count({ countFn: countFake })(req, res);
    expect(countFake).to.have.been.calledWith({
      root,
    });
    expect(sendFake).to.have.been.calledWith({ count: result });
  });
});
