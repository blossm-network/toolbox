const { expect } = require("chai");
const { dateComponents } = require("..");

describe("Valid date components", () => {
  it("should not contain errors if the data components are formatted correctly", () => {
    const validDateComponents = {
      time: 86399,
      day: 1,
      month: 1,
      year: 2019
    };
    const error = dateComponents(validDateComponents);
    expect(error).to.be.undefined;
  });
});

describe("Invalid date components", () => {
  it("should contain one error if a date component is missing", () => {
    const invalidDateComponents = {
      day: 1,
      month: 1,
      year: 2019
    };
    const response = dateComponents(invalidDateComponents);
    expect(response.message).to.exist;
  });
});
