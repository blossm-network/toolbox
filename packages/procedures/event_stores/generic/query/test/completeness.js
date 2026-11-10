import { expect } from "chai";
import query from "../index.js";

const event = (payload, number) => ({
  headers: { action: "set", number },
  payload,
  context: {},
  tx: {},
});
const create = (stateEvents) =>
  query({
    findSnapshotsFn: async () => [],
    rootStreamFn: async ({ fn }) => {
      for (const root of Object.keys(stateEvents)) await fn({ root });
    },
    findOneSnapshotFn: async () => undefined,
    eventStreamFn: async ({ query, fn }) => {
      for (const event of stateEvents[query["headers.root"]]) await fn(event);
    },
    handlers: { set: (state, payload) => ({ ...state, ...payload }) },
  });

describe("Complete aggregate queries", () => {
  it("does not traverse string implementation properties as JSON fields", async () => {
    expect(
      await create({ r: [event({ text: "abc" }, 0)] })([
        { key: "text.length", value: 3 },
      ]),
    ).to.deep.equal([]);
  });
  it("does not match inherited JavaScript properties as persisted state", async () => {
    expect(
      await create({ r: [event({ a: 1 }, 0)] })([
        { key: "constructor.name", value: "Object" },
      ]),
    ).to.deep.equal([]);
  });
  it("matches fields assembled across separate events", async () => {
    const result = await create({
      r: [event({ a: 1 }, 0), event({ b: 2 }, 1)],
    })([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    expect(result.map(({ headers }) => headers.root)).to.deep.equal(["r"]);
  });
  it("matches falsy values and later nested array elements", async () => {
    const result = await create({
      r: [
        event(
          {
            zero: 0,
            no: false,
            empty: "",
            items: [{ child: { code: "no" } }, { child: { code: "yes" } }],
          },
          0,
        ),
      ],
    })([
      { key: "zero", value: 0 },
      { key: "no", value: false },
      { key: "empty", value: "" },
      { key: "items.child.code", value: "yes" },
    ]);
    expect(result).to.have.length(1);
  });
  it("returns every matching root beyond 100 historical matches", async () => {
    const roots = Object.fromEntries(
      Array.from({ length: 120 }, (_, i) => [String(i), [event({ a: 1 }, 0)]]),
    );
    expect(await create(roots)([{ key: "a", value: 1 }])).to.have.length(120);
  });
});
