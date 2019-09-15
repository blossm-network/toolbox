const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const transports = require("@sustainers/gcp-log-transports");

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
    const errMessage = "Error message";
    const err = Error(errMessage);

    warn(message, { err });

    expect(transports.warn).to.have.been.calledWith(message, { err });
  });

  it("it should call the logger and attach the passed in error to the metadata", () => {
    replace(transports, "warn", fake());

    const message = "Debug message";
    const errMessage = "Error message";
    const err = Error(errMessage);
    const metadataWithError = { key: "value", err };

    warn(message, metadataWithError);

    expect(transports.warn).to.have.been.calledWith(message, metadataWithError);
  });
});
