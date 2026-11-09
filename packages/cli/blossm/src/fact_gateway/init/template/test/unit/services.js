import fs from "fs";
import * as chai from "chai";
import sinonChai from "sinon-chai";
import { fake } from "sinon";

chai.use(sinonChai);
const { expect } = chai;
const filename = new URL("../../services.js", import.meta.url);
const services = fs.existsSync(filename)
  ? (await import(filename.href)).default
  : undefined;

describe("fact gateway services tests", () => {
  if (!fs.existsSync(filename)) return;
  it("executes the example service", async () => {
    const send = fake();
    const status = fake.returns({ send });
    await services["some-name"]({}, { status });
    expect(status).to.have.been.calledOnceWithExactly(200);
    expect(send).to.have.been.calledOnceWithExactly("ok!");
  });
});
