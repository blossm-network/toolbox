const fs = require("fs");
const path = require("path");
const { fake, expect } = require("chai").use(require("sinon-chai"));

const services =
  fs.existsSync(path.resolve(__dirname, "../../services.js")) &&
  require("../../services");

describe("Command gateway services tests", () => {
  if (!services) return;
  it("should execute service correctly", async () => {
    const sendFake = fake();
    const statusFake = fake.returns({
      send: sendFake,
    });
    const resFake = {
      status: statusFake,
    };
    await services["some-name"]({}, resFake);
    expect(statusFake).to.have.been.calledWith(200);
    expect(sendFake).to.have.been.calledWith("ok!");
  });
});
