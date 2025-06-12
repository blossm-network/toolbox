const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
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
