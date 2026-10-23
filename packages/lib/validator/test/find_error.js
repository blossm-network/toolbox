import * as chai from "chai";
import validator from "../index.js";

const { expect } = chai;

describe("Errors exist", () => {
  it("should return the first error that is found", () => {
    const error = validator.findError([
      validator.string(123),
      validator.string(2),
    ]);
    expect(error.info().errors).to.be.of.length(2);
    expect(error.message).to.equal("Some information is invalid.");
  });
  it("should return nested errors that is found", () => {
    const message = "some-message";
    const path = "some-path";
    const toJSON = () => {
      return { info: { errors: [{ message, path }] } };
    };
    const error = validator.findError([{ toJSON }]);
    expect(error.info().errors).to.be.of.length(1);
    expect(error.message).to.equal("Some information is invalid.");
  });
});

describe("No errors", () => {
  it("should return null if no errors exits", () => {
    const error = validator.findError([
      validator.string(""),
      validator.string(""),
    ]);
    expect(error).to.be.null;
  });
});

describe("Composed error paths", () => {
  it("preserves paths through repeated composition", () => {
    let error = validator.name({ first: 123, last: "Ok" }, { path: "person" });
    error = validator.findError([validator.findError([error])]);
    expect(error.info().errors[0].path).to.equal("person.first");
  });
  it("joins tcomb path segments including array indexes", () => {
    const result = {
      isValid: () => false,
      errors: [{ message: "invalid", path: ["people", 0, "name"] }],
    };
    expect(validator.findError([result]).info().errors[0].path).to.equal(
      "people.0.name"
    );
  });
  it("keeps missing paths absent", () => {
    const error = validator.findError([validator.string(1)]);
    expect(validator.findError([error]).info().errors[0].path).to.equal(
      undefined
    );
  });
  it("uses relative paths for composite validators without a parent", () => {
    const cases = [
      [validator.name({ first: 123, last: "Ok" }), "first"],
      [
        validator.location({ postalCode: 123, countryCode: "US" }),
        "postalCode",
      ],
      [
        validator.dateComponents({ time: "bad", day: 1, month: 0, year: 2025 }),
        "time",
      ],
    ];
    for (const [error, path] of cases)
      expect(error.info().errors[0].path).to.equal(path);
  });
});
