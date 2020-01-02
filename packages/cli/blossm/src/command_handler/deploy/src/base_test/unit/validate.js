const { expect } = require("chai").use(require("sinon-chai"));

const validate = require("../../validate");

const { examples, invalid } = require("../../config.json");

describe("Command handler store validator tests", () => {
  const example0 = examples[0];
  it("should have at least one example", async () => {
    expect(example0).to.exist;
  });
  it("should handle correct payload correctly", async () => {
    try {
      for (const { payload } of examples) {
        await validate(payload);
      }
    } catch (e) {
      //shouldn't be called.
      expect(1).to.equal(0);
    }
  });

  const checkInvalidNextedObject = async ({ property, invalid, example }) => {
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

        //shouldn't be called.
        expect(0).to.equal(1);
      } catch (e) {
        expect(e.statusCode).to.equal(409);
      }
    }
  };
  it("should throw if bad param is passed", async () => {
    for (const property in invalid) {
      if (typeof property == "object")
        return await checkInvalidNextedObject({
          property,
          invalid,
          example: example0
        });

      const payload = {
        ...example0,
        [property]: invalid[property]
      };

      try {
        await validate(payload);

        //shouldn't be called.
        expect(0).to.equal(1);
      } catch (e) {
        expect(e.statusCode).to.equal(409);
      }
    }
  });
});
