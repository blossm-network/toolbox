import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";
import transports from "@blossm/gcp-log-transports";

import logger from "../index.js";

const { debug } = logger;

chai.use(sinonChai);

const { expect } = chai;

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
