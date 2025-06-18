import * as chai from "chai";
import jsonToCSV from "../index.js";

const { expect } = chai;

describe("JSON to CSV", () => {
  it("should return the correct download", () => {
    const result = jsonToCSV({
      data: [
        {
          id: "some-id",
          amount: "some-amount",
        },
      ],
      fields: ["id", "amount"],
    });
    expect(result).to.equal('"id","amount"\n"some-id","some-amount"');
  });
});
