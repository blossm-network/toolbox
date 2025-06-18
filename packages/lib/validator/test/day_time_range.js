import * as chai from "chai";
import { dayTimeRange } from "../index.js";

const { expect } = chai;

describe("Valid date time range", () => {
  it("should not contain errors if the number is within range", () => {
    const validNumber = 5;
    const response = dayTimeRange(validNumber);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid date time range", () => {
  it("should contain one error if the number is out of range", () => {
    const invalidNumber = 86400;
    const response = dayTimeRange(invalidNumber);
    expect(response.errors).to.have.lengthOf(1);
  });
});
