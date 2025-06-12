const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const basicToken = require("..");

describe("Basic token", () => {
  it("should call correctly", async () => {
    const root = "some-root";
    const secret = "some-secret";
    const result = await basicToken({ root, secret });

    const credentials = Buffer.from(result.token, "base64").toString("ascii");
    const [checkId, checkSecret] = credentials.split(":");
    expect(checkId).to.equal(root);
    expect(checkSecret).to.equal(secret);
    expect(result.type).to.equal("Basic");
  });
});
