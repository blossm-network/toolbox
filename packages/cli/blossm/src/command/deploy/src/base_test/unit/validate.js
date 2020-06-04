const { expect } = require("chai").use(require("sinon-chai"));

const validate = require("../../validate");

const { testing } = require("../../config.json");

describe("Command handler store validator tests", () => {
  it("should handle correct payload correctly", async () => {
    if (!testing.validate || !testing.validate.ok) return;
    try {
      for (const payload of testing.validate.ok)
        await validate(payload, {
          ...(testing.validate.aud && { aud: testing.valdiate.aud }),
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
            ...(testing.validate.aud && { aud: testing.validate.aud }),
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
    payload[property] =
      bad[property] != undefined
        ? typeof ok[property] == "object" &&
          !(ok[property] instanceof Array) &&
          typeof bad[property] == "object" &&
          !(bad[property] instanceof Array)
          ? createBadPayload({
              bad: bad[property],
              ok: ok[property],
            })
          : (payload[property] = bad[property])
        : (payload[property] = ok[property]);
  }

  return payload;
};
