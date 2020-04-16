const { expect } = require("chai");
const { location } = require("..");

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
