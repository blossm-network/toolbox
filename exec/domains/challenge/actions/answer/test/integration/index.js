require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const command = require("@blossm/command-rpc");
const sms = require("@blossm/twilio-sms");
const { get: secret } = require("@blossm/gcp-secret");
const uuid = require("@blossm/uuid");
const { validate: validateJwt } = require("@blossm/jwt");
const { verify } = require("@blossm/gcp-kms");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = "http://main";
const deps = require("../../deps");

const personRoot = uuid();
const phone = "251-333-2037";

const config = require("./../config.js");

describe("Command handler store integration tests", () => {
  before(async () => await Promise.all(config.topics.map(t => create(t))));
  after(async () => await Promise.all(config.topics.map(t => del(t))));

  it("should return successfully", async () => {
    await deps
      .viewStore({
        name: "phones",
        domain: "person"
      })
      //phone should be already formatted in the view store.
      .update(personRoot, { phone: "+12513332037" });
    const sentAfter = new Date();

    const { token, root } = await command({
      action: "issue",
      domain: "challenge"
    }).issue({ phone });

    const jwt = await validateJwt({
      token,
      verifyFn: verify({
        ring: process.env.SERVICE,
        key: "challenge",
        location: "global",
        version: "1",
        project: process.env.GCP_PROJECT
      })
    });

    const [message] = await sms(
      await secret("twilio-account-sid"),
      await secret("twilio-auth-token")
    ).list({ sentAfter, limit: 1, to: "+12513332037" });

    const code = message.body.substr(0, 6);

    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: uuid(),
          root
        },
        payload: {
          code
        },
        context: {
          challenge: root,
          person: jwt.person
        }
      }
    });

    expect(response.statusCode).to.equal(200);
    const parsedBody = JSON.parse(response.body);

    const aggregate = await eventStore({
      domain: process.env.DOMAIN
    }).aggregate(parsedBody.root);

    expect(aggregate.headers.root).to.equal(parsedBody.root);
    expect(aggregate.state.phone).to.equal("+12513332037");

    const { deletedCount } = await deps
      .viewStore({
        name: "phones",
        domain: "person"
      })
      .delete(personRoot);

    expect(deletedCount).to.equal(1);
  });
  it("should return an error if incorrect params", async () => {
    const code = { a: 1 };
    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate(),
          id: uuid()
        },
        payload: {
          code
        }
      }
    });
    expect(response.statusCode).to.equal(409);
  });
});
