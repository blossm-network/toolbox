const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, replace, fake } = require("sinon");
const transports = require("@blossm/gcp-log-transports");

const { warn } = require("../index");

describe("Logging", () => {
  afterEach(() => {
    restore();
  });

  it("it should call the logger", () => {
    replace(transports, "warn", fake());

    const message = "Debug message";
    const metadata = { key: "value" };

    warn(message, metadata);

    expect(transports.warn).to.have.been.calledWith(message, metadata);
  });

  it("it should call the logger and create a metadata object with the error in it", () => {
    replace(transports, "warn", fake());

    const message = "Debug message";
    const errorMessage = "Error message";
    const err = Error(errorMessage);

    warn(message, { err });

    expect(transports.warn).to.have.been.calledWith(message, { err });
  });

  it("it should call the logger and attach the passed in error to the metadata", () => {
    replace(transports, "warn", fake());

    const message = "Debug message";
    const errorMessage = "Error message";
    const err = Error(errorMessage);
    const metadataWithError = { key: "value", err };

    warn(message, metadataWithError);

    expect(transports.warn).to.have.been.calledWith(message, metadataWithError);
  });
});
