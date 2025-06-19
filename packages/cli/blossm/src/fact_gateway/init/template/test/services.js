import fs from "fs";
import path from "path";
import * as chai from "chai";
import sinonChai from "sinon-chai";

chai.use(sinonChai);
const { fake, expect } = chai;

const services =
  fs.existsSync(path.resolve(__dirname, "../../services.js")) &&
  import("../../services.js");

describe("Fact gateway services tests", () => {
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
