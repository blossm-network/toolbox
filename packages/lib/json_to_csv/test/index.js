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

describe("Spreadsheet-safe downloads", () => {
  it("makes formula-leading text inert when explicitly requested", () => {
    const inputs = [
      "=1+1",
      "+1+1",
      "-1+1",
      "@SUM(1)",
      "  =1+1",
      "\t=1+1",
      "\rplain",
      "\nplain",
    ];
    for (const value of inputs) {
      const result = jsonToCSV({
        data: [{ value }],
        fields: ["value"],
        spreadsheetSafe: true,
      });
      expect(result).to.equal(`"value"\n"'${value}"`);
    }
  });
  it("covers extracted fields and headers without changing numbers or CSV quoting", () => {
    const result = jsonToCSV({
      data: [{ amount: -3, text: 'a,"b"' }],
      fields: [{ label: "=header", value: () => "=1+1" }, "amount", "text"],
      spreadsheetSafe: true,
    });
    expect(result).to.equal(`"'=header","amount","text"\n"'=1+1",-3,"a,""b"""`);
  });
  it("preserves raw CSV by default for machine consumers", () => {
    expect(
      jsonToCSV({ data: [{ value: "=1+1" }], fields: ["value"] })
    ).to.equal('"value"\n"=1+1"');
  });
});
