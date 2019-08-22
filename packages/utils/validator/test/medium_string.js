const { expect } = require("chai");
const { mediumString } = require("..");

describe("Valid medium strings", () => {
  const validShortString = "Vulpes bengalensis is a relatively small fox.";
  it("should not contain errors if the password is formatted correctly", () => {
    const response = mediumString(validShortString);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid medium strings", () => {
  const invalidShortString =
    "Vulpes bengalensis is a relatively small fox with an elongated muzzle, long, pointed ears, and a bushy tail about 50 to 60% of the length of the head and body.";
  it("should contain one error if the string is too long", () => {
    const response = mediumString(invalidShortString);
    expect(response.errors).to.have.lengthOf(1);
  });
});
