const { expect } = require("chai").use(require("sinon-chai"));

const validate = require("../../validate");

const { testing } = require("../../config.json");

const checkInvalidNestedObject = async ({ property, invalid, example }) => {
  for (const prop in invalid[property]) {
    const payload = {
      ...example,
      [property]: {
        ...example[property],
        [prop]: invalid[property][prop]
      }
    };

    try {
      await validate(payload);

      //shouldn't get called.
      expect(0).to.equal(1);
    } catch (e) {
      expect(e.statusCode).to.equal(409);
    }
  }
};

describe("Command handler store validator tests", () => {
  const example0 = testing.examples.ok[0];
  it("should have at least one example", async () => {
    expect(example0).to.exist;
  });
  it("should handle correct payload correctly", async () => {
    try {
      for (const { payload } of [
        ...testing.examples.ok,
        ...(testing.examples.bad || [])
      ]) {
        await validate(payload);
      }
    } catch (e) {
      //shouldn't get called.
      expect(1).to.equal(0);
    }
  });

  it("should throw if invalid param is passed", async () => {
    if (!testing.invalid) return;
    for (const value of testing.invalid) {
      for (const property in value) {
        if (typeof property == "object")
          return await checkInvalidNestedObject({
            property,
            invalid: value,
            example: example0
          });

        const payload = {
          ...example0,
          [property]: testing.invalid[property]
        };

        try {
          await validate(payload);

          //shouldn't get called.
          expect(0).to.equal(1);
        } catch (e) {
          expect(e.statusCode).to.equal(409);
        }
      }
    }
  });
});
