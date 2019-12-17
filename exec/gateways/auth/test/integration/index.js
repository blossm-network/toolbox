require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const viewStore = require("@blossm/view-store-rpc");
const sms = require("@blossm/twilio-sms");
const { get: secret } = require("@blossm/gcp-secret");
const uuid = require("@blossm/uuid");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const personRoot = uuid();
const topics = [
  `did-issue.challenge.${process.env.SERVICE}.${process.env.NETWORK}`,
  `did-answer.challenge.${process.env.SERVICE}.${process.env.NETWORK}`
];
describe("Auth gateway integration tests", () => {
  before(async () => await Promise.all([create(topics[0]), create(topics[1])]));
  after(async () => await Promise.all([del(topics[0]), del(topics[1])]));
  it("should return successfully", async () => {
    const phone = "251-333-2037";
    await viewStore({
      name: "phones",
      domain: "person"
    })
      //phone should be already formatted in the view store.
      .update(personRoot, { phone: "+12513332037" });

    const sentAfter = new Date();

    const response0 = await request.post(`${url}/challenge/issue`, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          phone
        }
      }
    });

    expect(response0.statusCode).to.equal(200);
    const { token, root } = JSON.parse(response0.body);

    const [message] = await sms(
      await secret("twilio-account-sid"),
      await secret("twilio-auth-token")
    ).list({ sentAfter, limit: 1, to: "+12513332037" });

    const code = message.body.substr(0, 6);

    const response1 = await request.post(`${url}/challenge/answer`, {
      body: {
        headers: {
          issued: stringDate(),
          root
        },
        payload: {
          code
        }
      },
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(response1.statusCode).to.equal(200);
    const parsedBody = JSON.parse(response1.body);

    const aggregate = await eventStore({
      domain: "challenge"
    }).aggregate(parsedBody.root);

    expect(aggregate.headers.root).to.equal(parsedBody.root);
    expect(aggregate.state.answered).to.exist;

    const { deletedCount } = await viewStore({
      name: "phones",
      domain: "person"
    }).delete(personRoot);

    expect(deletedCount).to.equal(1);
  });
  it("should return an error if incorrect params", async () => {
    const phone = { a: 1 };
    const response = await request.post(`${url}/challenge/issue`, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          phone
        }
      }
    });
    expect(response.statusCode).to.equal(409);
  });
});
