const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake } = require("sinon");
const transports = require("@blossm/gcp-log-transports");

const { info } = require("../index");

describe("Logging", () => {
  afterEach(() => {
    restore();
  });
  it("it should call the logger", () => {
    replace(transports, "info", fake());

    const message = "Debug message";
    const metadata = { key: "value" };

    info(message, metadata);

    expect(transports.info).to.have.been.calledWith(message, metadata);
  });
});
