const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const transports = require("@sustainers/log-transports");

const { verbose } = require("../index");

describe("Logging", () => {
  afterEach(() => {
    restore();
  });
  it("it should call the logger", () => {
    replace(transports, "verbose", fake());

    const message = "Debug message";
    const metadata = { key: "value" };

    verbose(message, metadata);

    expect(transports.verbose).to.have.been.calledWith(message, metadata);
  });
});
