const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const transports = require("@blossm/gcp-log-transports");

const { debug } = require("../index");

describe("Logging", () => {
  afterEach(() => {
    restore();
  });

  it("it should call the logger", () => {
    replace(transports, "debug", fake());

    const message = "Debug message";
    const metadata = { key: "value" };

    debug(message, metadata);

    expect(transports.debug).to.have.been.calledWith(message, metadata);
  });
});
