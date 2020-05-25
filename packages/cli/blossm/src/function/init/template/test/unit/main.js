const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");

const main = require("../../main");

describe("Function unit tests", () => {
  afterEach(() => {
    restore();
  });
  it("should return successfully", async () => {
    const req = "some-res";

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    await main(req, res);
    expect(sendFake).to.have.been.calledWith({ some: "thing" });
  });
});
