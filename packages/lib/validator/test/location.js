import * as chai from "chai";
import { location } from "../index.js";

const { expect } = chai;

describe("Valid location", () => {
  it("should not contain errors if the location is formatted correctly", () => {
    const validLocation = {
      postalCode: "94110",
      countryCode: "US",
    };
    const error = location(validLocation);
    expect(error).to.be.undefined;
  });
});
