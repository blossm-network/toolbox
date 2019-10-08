const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const normalizeCommand = require("../");
const deps = require("../deps");

const payload = "some-payload";

const issued = "some-issued";
const trace = "some-trace";
const source = "some-source";

describe("Normalize command", () => {
  afterEach(() => {
    restore();
  });
  it("should get called with expected params", async () => {
    const newNonce = "newNonce!";
    replace(deps, "nonce", fake.returns(newNonce));

    const params = {
      payload,
      headers: {
        issued,
        trace,
        source
      }
    };

    const result = await normalizeCommand(params);

    expect(result).to.deep.equal({
      headers: {
        id: newNonce,
        issued,
        trace,
        source
      },
      payload
    });
  });
  it("should get called with expected params with optionals omitted", async () => {
    const newNonce = "newNonce!";
    replace(deps, "nonce", fake.returns(newNonce));

    const params = {
      payload,
      headers: {
        issued
      }
    };

    const result = await normalizeCommand(params);

    expect(result).to.deep.equal({
      headers: {
        id: newNonce,
        issued
      },
      payload
    });
  });
});
