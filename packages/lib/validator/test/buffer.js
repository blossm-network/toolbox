import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

const invalidBuffers = ["hello", 0, () => 0, {}];
const validBuffer = new Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);

describe("Valid buffer", () => {
  it("should not contain errors if value is a buffer", () => {
    const response = validator.buffer(validBuffer);
    expect(response.errors).to.be.empty;
  });
});

describe("Optional buffers", () => {
  it("should not contain errors if value is not empty", () => {
    const response = validator.buffer(validBuffer, { optional: true });
    expect(response.errors).to.be.empty;
  });
  it("should not contain errors if value is null", () => {
    const response = validator.buffer(null, { optional: true });
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid buffer", () => {
  it("should contain one error if something other than a buffer is passed in", () => {
    invalidBuffers.forEach((invalidBoolean) => {
      let response = validator.buffer(invalidBoolean);
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});

describe("Invalid optional buffer", () => {
  it("should contain one error if something other than a buffer is passed in, regardless of optional flag", () => {
    invalidBuffers.forEach((invalidBoolean) => {
      let response = validator.buffer(invalidBoolean, { optional: true });
      expect(response.errors).to.have.lengthOf(1);
    });
  });
});
