import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";
import transports from "@blossm/gcp-log-transports";

import { verbose } from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

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
