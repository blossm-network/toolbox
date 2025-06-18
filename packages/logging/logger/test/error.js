import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";
import transports from "@blossm/gcp-log-transports";

import { error } from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

describe("Logging", () => {
  afterEach(() => {
    restore();
  });

  it("it should call the logger", () => {
    replace(transports, "error", fake());

    const message = "Debug message";
    const metadata = { key: "value" };

    error(message, metadata);

    expect(transports.error).to.have.been.calledWith(message, metadata);
  });

  it("it should call the logger and create a metadata object with the error in it", () => {
    replace(transports, "error", fake());

    const message = "Debug message";
    const errorMessage = "Error message";
    const err = Error(errorMessage);

    error(message, { err });

    expect(transports.error).to.have.been.calledWith(message, { err });
  });

  it("it should call the logger and attach the passed in error to the metadata", () => {
    replace(transports, "error", fake());

    const message = "Debug message";
    const errorMessage = "Error message";
    const err = Error(errorMessage);
    const metadataWithError = { err, key: "value" };

    error(message, metadataWithError);

    expect(transports.error).to.have.been.calledWith(
      message,
      metadataWithError
    );
  });
});
