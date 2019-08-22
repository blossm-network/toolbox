const { expect } = require("chai");
const { format } = require("..");

describe("Valid numbers", () => {
  it("should return an E164 formatted phone number, if the input is a valid phone number", () => {
    const validPhoneNumber = "9193571144";
    const formattedPhoneNumber = format(validPhoneNumber);
    expect(formattedPhoneNumber).to.be.equal("+19193571144");
  });

  it("should return an E164 formatted phone number, if the input is a valid phone number with seperator symbols", () => {
    const validPhoneNumber = "(919) 357 - 1144";
    const formattedPhoneNumber = format(validPhoneNumber);
    expect(formattedPhoneNumber).to.be.equal("+19193571144");
  });

  it("should return an E164 formatted phone number, if the input is a valid international phone number", () => {
    const validPhoneNumber = "6281244953395";
    const formattedPhoneNumber = format(validPhoneNumber);
    expect(formattedPhoneNumber).to.be.equal("+6281244953395");
  });

  it("should return an E164 formatted phone number, if the input is a valid international phone number with symbols", () => {
    const validPhoneNumber = "+1 (919) 357-1144";
    const formattedPhoneNumber = format(validPhoneNumber);
    expect(formattedPhoneNumber).to.be.equal("+19193571144");
  });
});

describe("Invalid numbers", () => {
  it("should return null if the input is not a valid phone number", () => {
    const invalidPhoneNumber = "1234";
    const formattedPhoneNumber = format(invalidPhoneNumber);
    expect(formattedPhoneNumber).to.be.null;
  });

  it("should return null if the input is null", () => {
    const nullPhoneNumber = null;
    const formattedPhoneNumber = format(nullPhoneNumber);
    expect(formattedPhoneNumber).to.be.null;
  });

  it("should return null if the input is empty", () => {
    const formattedPhoneNumber = format();
    expect(formattedPhoneNumber).to.be.null;
  });
});
