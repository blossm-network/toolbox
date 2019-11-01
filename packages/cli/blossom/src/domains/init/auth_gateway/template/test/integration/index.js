const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");
const eventStore = require("@sustainers/event-store-js");
const viewStore = require("@sustainers/view-store-js");
const sms = require("@sustainers/twilio-sms");
const secret = require("@sustainers/gcp-secret");
const uuid = require("@sustainers/uuid");

const request = require("@sustainers/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const personRoot = uuid();

describe("Command handler store integration tests", () => {
  it("should return successfully", async () => {
    //eslint-disable-next-line no-console
    console.log("0");
    const phone = "251-333-2037";
    await viewStore({
      name: "phones",
      domain: "person",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    })
      //phone should be already formatted in the view store.
      .update(personRoot, { phone: "+12513332037" });

    //eslint-disable-next-line no-console
    console.log("1");

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

    //eslint-disable-next-line no-console
    console.log("response0: ", response0);

    expect(response0.statusCode).to.equal(200);
    const { token, root } = JSON.parse(response0.body);

    //eslint-disable-next-line no-console
    console.log("stuff: ", { token, root });

    const [message] = await sms(
      await secret("twilio-account-sid"),
      await secret("twilio-auth-token")
    ).list({ sentAfter, limit: 1, to: "+12513332037" });

    const code = message.body.substr(0, 6);

    //eslint-disable-next-line no-console
    console.log("code: ", code);

    const response1 = await request.post(`${url}/challenge/answer`, {
      body: {
        headers: {
          issued: stringDate(),
          root,
          authorization: `Bearer ${token}`
        },
        payload: {
          code
        }
      }
    });

    //eslint-disable-next-line no-console
    console.log("response1: ", response1);

    expect(response1.statusCode).to.equal(200);
    const parsedBody = JSON.parse(response1.body);

    const aggregate = await eventStore({
      domain: process.env.DOMAIN,
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).aggregate(parsedBody.root);

    expect(aggregate.headers.root).to.equal(parsedBody.root);
    expect(aggregate.state.phone).to.equal("+12513332037");

    const { deletedCount } = await viewStore({
      name: "phones",
      domain: "person",
      service: process.env.SERVICE,
      network: process.env.NETWORK
    }).delete(personRoot);

    expect(deletedCount).to.equal(1);
  });
  // it("should return an error if incorrect params", async () => {
  //   const code = { a: 1 };
  //   const response = await request.post(url, {
  //     body: {
  //       headers: {
  //         issued: stringDate()
  //       },
  //       payload: {
  //         code
  //       }
  //     }
  //   });
  //   expect(response.statusCode).to.equal(409);
  // });
});
