const { expect } = require("chai");
const jsonToCSV = require("..");

describe("JSON to CSV", () => {
  it("should return the correct download", () => {
    const result = jsonToCSV({
      data: {
        id: "some-id",
        amount: "some-amount",
      },
      fields: ["id", "amount"],
    });
    expect(result).to.equal('"id","amount"\n"some-id","some-amount"');
  });
});
