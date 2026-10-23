import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import save from "../index.js";
import deps from "../deps.js";

describe("Private event-write failures", () => {
  afterEach(restore);
  for (const code of [11000, 12345]) {
    it(`does not log failed operation payloads or claims for driver code ${code}`, async () => {
      const secret = "synthetic-private-payload-and-claim";
      const driverError = Object.assign(new Error("insert failed"), {
        code,
        writeErrors: [
          {
            err: {
              errmsg: 'dup key: { hash: "event" }',
              op: {
                payload: { token: secret },
                tx: { claims: { private: secret } },
              },
            },
          },
        ],
      });
      replace(deps, "db", { create: fake.rejects(driverError) });
      const output = [];
      const capture = (chunk, ...args) => {
        output.push(String(chunk));
        const callback = args.at(-1);
        if (typeof callback === "function") callback();
        return true;
      };
      replace(process.stdout, "write", capture);
      replace(process.stderr, "write", capture);
      let actual;
      try {
        try {
          await save({ eventStore: {}, handlers: { set() {} } })({
            events: [{ headers: { action: "set" } }],
          });
        } catch (err) {
          actual = err;
        }
        await new Promise((resolve) => setImmediate(resolve));
      } finally {
        restore();
      }
      expect(output.join("")).not.to.include(secret);
      if (code === 11000) {
        expect(actual.statusCode).to.equal(412);
        expect(actual.cause()).to.equal(driverError);
      } else expect(actual).to.equal(driverError);
    });
  }
});
