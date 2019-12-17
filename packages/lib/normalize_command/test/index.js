const { expect } = require("chai").use(require("sinon-chai"));
const { restore } = require("sinon");
const normalizeCommand = require("../");

const payload = "some-payload";

const issued = "some-issued";
const trace = "some-trace";
const source = "some-source";

describe("Normalize command", () => {
  afterEach(() => {
    restore();
  });
  it("should get called with expected params", async () => {
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
        issued,
        trace,
        source
      },
      payload
    });
  });
  it("should get called with expected params with optionals omitted", async () => {
    const params = {
      payload,
      headers: {
        issued
      }
    };

    const result = await normalizeCommand(params);

    expect(result).to.deep.equal({
      headers: {
        issued
      },
      payload
    });
  });
});
