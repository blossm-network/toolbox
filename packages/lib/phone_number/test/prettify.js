const { expect } = require("chai");
const { prettify } = require("..");

describe("Valid numbers", () => {
  it("should return an E164 formatted phone number, if the input is a valid phone number", () => {
    const phoneNumber = "+19193571144";
    const formattedPhoneNumber = prettify(phoneNumber);
    expect(formattedPhoneNumber).to.be.equal("+1 (919) 357-1144");
  });

  it("should return an E164 formatted phone number, if the input is a valid international phone number", () => {
    const phoneNumber = "6281244953395";
    const formattedPhoneNumber = prettify(phoneNumber);
    expect(formattedPhoneNumber).to.be.equal("+6281244953395");
  });

  it("should return an E164 formatted phone number, if the input is a valid international phone number with symbols", () => {
    const validPhoneNumber = "+1 (919) 357-1144";
    const formattedPhoneNumber = prettify(validPhoneNumber);
    expect(formattedPhoneNumber).to.be.equal("+1 (919) 357-1144");
  });
});

describe("Invalid numbers", () => {
  it("should return null if the input is not a valid phone number", () => {
    const invalidPhoneNumber = "1234";
    const formattedPhoneNumber = prettify(invalidPhoneNumber);
    expect(formattedPhoneNumber).to.be.null;
  });
});
