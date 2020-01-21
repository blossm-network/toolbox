require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const { create, delete: del } = require("@blossm/gcp-pubsub");
const sms = require("@blossm/twilio-sms");
const { get: secret } = require("@blossm/gcp-secret");
const getToken = require("@blossm/get-token");
const request = require("@blossm/request");

const phone = "+12513332037";

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("../../config.json");

describe("Command gateway integration tests", () => {
  before(async () => await Promise.all(testing.topics.map(t => create(t))));
  after(async () => await Promise.all(testing.topics.map(t => del(t))));
  it("should return successfully", async () => {
    const { token: anonymousToken } = await getToken({ phone });
    expect(anonymousToken).to.exist;

    //eslint-disable-next-line no-console
    console.log("anonymous token: ", anonymousToken);

    const sentAfter = new Date();
    const response = await request.post(`${url}/issue`, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          phone
        }
      },
      headers: {
        Authorization: `Bearer ${anonymousToken}`
      }
    });
    expect(response.statusCode).to.equal(200);
    const { token } = JSON.parse(response.body);

    //eslint-disable-next-line
    console.log("issue token: ", token);

    const [message] = await sms(
      await secret("twilio-account-sid"),
      await secret("twilio-auth-token")
    ).list({ sentAfter, limit: 1, to: phone });

    const code = message.body.substr(0, 6);

    //eslint-disable-next-line
    console.log("custom answer: ", { code, token });
    const response1 = await request.post(`${url}/answer`, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          code
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    //eslint-disable-next-line
    console.log("response 1: ", response1);
    expect(response1.statusCode).to.equal(200);
    const { token: answerToken } = JSON.parse(response1.body);

    //eslint-disable-next-line
    console.log("answer token: ", answerToken);

    return { token: answerToken };
  });
});
