const { expect } = require("chai");
// const { string: stringDate } = require("@sustainers/datetime");
// const eventStore = require("@sustainers/event-store-js");
const command = require("@sustainers/command-js");
// const sms = require("@sustainers/twilio-sms");
// const secret = require("@sustainers/gcp-secret");
const uuid = require("@sustainers/uuid");

// const request = require("@sustainers/request");

// const url = `http://${process.env.MAIN_CONTAINER_NAME}`;
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

    // const sentAfter = new Date();

    const { token } = await command({
      action: "issue",
      domain: "challenge",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).issue({
      phone
    });

    // console.log("token: ", token);

    // console.log("env: ", { env: process.env });

    // const messages = await sms(
    //   await secret("twilio-account-sid"),
    //   await secret("twilio-auth-token")
    // ).list({ sentAfter, limit: 1 });

    // console.log("messages: ", messages);
    expect(token).to.equal(2);
    // const name = "Some-name";
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

    // const root = JSON.parse(response.body).root;

    // const aggregate = await eventStore({
    //   domain: process.env.DOMAIN,
    //   service: process.env.SERVICE,
    //   network: process.env.NETWORK
    // }).aggregate(root);

    // expect(aggregate.headers.root).to.equal(root);
    // expect(aggregate.state.name).to.equal(name.toLowerCase());
    // expect(response.statusCode).to.equal(200);
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
