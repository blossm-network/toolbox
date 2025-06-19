import fs from "fs";
import path from "path";
import * as chai from "chai";
import sinonChai from "sinon-chai";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
