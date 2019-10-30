const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");
const eventStore = require("@sustainers/event-store-js");
const command = require("@sustainers/command-js");
const sms = require("@sustainers/twilio-sms");
const secret = require("@sustainers/gcp-secret");
const uuid = require("@sustainers/uuid");

const request = require("@sustainers/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;
const deps = require("../../deps");

const personRoot = uuid();

describe("Command handler store integration tests", () => {
  it("should return successfully", async () => {
    const phone = "251-333-2037";
    await deps
      .viewStore({
        name: "phones",
        domain: "person",
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      //phone should be already formatted in the view store.
      .update(personRoot, { phone: "+12513332037" });

    const sentAfter = new Date();

    const { token, root } = await command({
      action: "issue",
      domain: "challenge",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).issue({
      phone
    });

    //eslint-disable-next-line no-console
    console.log("token: ", token);

    const [message] = await sms(
      await secret("twilio-account-sid"),
      await secret("twilio-auth-token")
    ).list({ sentAfter, limit: 1 });

    //eslint-disable-next-line no-console
    console.log("message: ", message);
    const code = message.body.substr(0, 6);

    //eslint-disable-next-line no-console
    console.log("code: ", code);

    const response = await request.post(url, {
      body: {
        headers: {
          issued: stringDate()
        },
        payload: {
          code
        },
        context: {
          challenge: root
        }
      }
    });

    //eslint-disable-next-line no-console
    console.log("rezzy: ", response);

    expect(response.statusCode).to.equal(200);
    const parsedBody = JSON.parse(response.body);

    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).aggregate(parsedBody.root);

    //eslint-disable-next-line no-console
    console.log("aggy: ", aggregate);

    expect(aggregate.headers.root).to.equal(parsedBody.root);
    expect(aggregate.state.phone).to.equal("+12513332037");

    const { deletedCount } = await deps
      .viewStore({
        name: "phones",
        domain: "person",
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      .delete(personRoot);

    //eslint-disable-next-line no-console
    console.log("del count: ", deletedCount);

    expect(deletedCount).to.equal(1);
  });
  it("should return an error if incorrect params", async () => {
    // const name = 3;
    // const response = await request.post(url, {
    //   body: {
    //     headers: {
    //       issued: stringDate()
    //     },
    //     payload: {
    //       name
    //     }
    //   }
    // });
    // expect(response.statusCode).to.equal(400);
  });
});
