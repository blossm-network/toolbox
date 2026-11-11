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

describe("Spreadsheet downloads", () => {
  it("prefixes formula-leading strings by default", () => {
    const values = [
      "=1+1",
      "+1+1",
      "-1+1",
      "@SUM(1)",
      "  =1+1",
      "\t=1+1",
      "\rplain",
      "\nplain",
      "\u0000=1",
      "\u0085=1",
      "＝1+1",
      "＋1+1",
      "－1+1",
      "＠SUM(1)",
    ];
    for (const value of values) {
      expect(jsonToCSV({ data: [{ value }], fields: ["value"] })).to.equal(
        `"value"\n"'${value}"`,
      );
    }
  });
  it("protects extracted strings and headers while preserving numbers and quoting", () => {
    const result = jsonToCSV({
      data: [{ amount: -3, text: 'a,"b"' }],
      fields: [{ label: "=header", value: () => "=1+1" }, "amount", "text"],
    });
    expect(result).to.equal(`"'=header","amount","text"\n"'=1+1",-3,"a,""b"""`);
  });
  it("keeps normal string values unchanged", () => {
    expect(
      jsonToCSV({ data: [{ value: "ordinary" }], fields: ["value"] }),
    ).to.equal('"value"\n"ordinary"');
  });
});

it("protects nested values and serialized strings while retaining CSV cell boundaries", () => {
  const data = [
    {
      nested: { value: "\ufeff\t＝1+1" },
      serialized: { toJSON: () => "=1+1" },
      text: 'ordinary,"=1+1\nnext',
    },
  ];
  expect(
    jsonToCSV({ data, fields: ["nested.value", "serialized", "text"] }),
  ).to.equal(
    `"nested.value","serialized","text"\n"'\ufeff\t＝1+1","'=1+1","ordinary,""=1+1\nnext"`,
  );
});
