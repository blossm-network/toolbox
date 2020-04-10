const { expect } = require("chai").use(require("sinon-chai"));
const basicToken = require("..");

describe("Basic token", () => {
  it("should call correctly", async () => {
    const id = "some-id";
    const secret = "some-secret";
    const result = await basicToken({ id, secret });

    const credentials = Buffer.from(result.token, "base64").toString("ascii");
    const [checkId, checkSecret] = credentials.split(":");
    expect(checkId).to.equal(id);
    expect(checkSecret).to.equal(secret);
    expect(result.type).to.equal("Basic");
  });
});
