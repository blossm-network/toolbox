import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

import validate from "../../validate.js";

import config from "../../config.json" with { type: "json" };

const { testing } = config;

describe("Command handler store validator tests", () => {
  it("should handle correct payload correctly", async () => {
    if (!testing.validate || !testing.validate.ok) return;
    try {
      for (const payload of testing.validate.ok)
        await validate(payload, {
          ...(testing.validate.context && {
            context: testing.validate.context,
          }),
        });
    } catch (e) {
      //shouldn't get called.
      expect(1).to.equal(0);
    }
  });

  it("should throw if invalid param is passed", async () => {
    if (!testing.validate || !testing.validate.bad) return;
    for (const value of testing.validate.bad) {
      try {
        await validate(
          createBadPayload({
            bad: value,
            ok: testing.validate.ok[0] || {},
          }),
          {
            ...(testing.validate.context && {
              context: testing.validate.context,
            }),
          }
        );

        //shouldn't get called.
        expect(0).to.equal(1);
      } catch (e) {
        if (!e.statusCode) {
          //eslint-disable-next-line no-console
          console.log(e);
        }
        expect(e.statusCode).to.equal(409);
      }
    }
  });
});

const createBadPayload = ({ bad, ok }) => {
  let payload = { ...bad };

  for (const property in ok) {
    if (bad[property] == undefined) payload[property] = ok[property];
    else if (
      typeof ok[property] == "object" &&
      !(ok[property] instanceof Array) &&
      typeof bad[property] == "object" &&
      !(bad[property] instanceof Array)
    )
      payload[property] = createBadPayload({
        bad: bad[property],
        ok: ok[property],
      });
    else if (ok[property] instanceof Array && bad[property] instanceof Array)
      payload[property] = [
        createBadPayload({
          bad: bad[property][0],
          ok: ok[property][0],
        }),
      ];
    else {
      payload[property] = bad[property];
    }
  }

  return payload;
};
