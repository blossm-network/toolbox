const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore } = require("sinon");

const validateErrorInfo = require("../../src/utils/validation_error_info");

describe("Validate error info", () => {
  afterEach(() => {
    restore();
  });
  it("should return formatted errors", async () => {
    const errorMessage0 = "some-error";
    const path0 = "/somePath/yep";
    const errorMessage1 = "some-other-error";
    const path1 = "/someOtherPath/";
    const err = {
      body: {
        _embedded: {
          errors: [
            { message: errorMessage0, path: path0 },
            { message: errorMessage1, path: path1 },
          ],
        },
      },
    };

    const result = validateErrorInfo(err);
    expect(result).to.deep.equal({
      errors: [
        {
          message: errorMessage0,
          path: "somePath.yep",
        },
        {
          message: errorMessage1,
          path: "someOtherPath",
        },
      ],
    });
  });
  it("should return null if errors not found", async () => {
    const errorMessage0 = "some-error";
    const errorMessage1 = "some-other-error";
    const err = {
      body: {
        _embedded: [{ message: errorMessage0 }, { message: errorMessage1 }],
      },
    };
    const result = validateErrorInfo(err);

    expect(result).to.be.undefined;
  });
});
