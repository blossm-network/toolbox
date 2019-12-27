require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store-rpc");
const getToken = require("@blossm/get-token");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const config = require("./../../config.json");

describe("Command gateway integration tests", () => {
  before(async () => await Promise.all(config.topics.map(t => create(t))));
  after(async () => await Promise.all(config.topics.map(t => del(t))));

  it("should return successfully", async () => {
    const issueFn = async ({ phone }) => {
      const response0 = await request.post(`${url}/issue`, {
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
      return { token, root };
    };
    const answerFn = async ({ code, root, token }) => {
      //eslint-disable-next-line
      console.log("toke: ", token);
      const response1 = await request.post(`${url}/answer`, {
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
      const { token: newToken } = JSON.parse(response1.body);

      return { root, token: newToken };
    };

    const { token, root } = await getToken({
      issueFn,
      answerFn
    });

    expect(root).to.exist();
    expect(token).to.exist();

    const aggregate = await eventStore({
      domain: "challenge"
    }).aggregate(root);

    expect(aggregate.headers.root).to.equal(root);
    expect(aggregate.state.answered).to.exist;
  });
  it("should return an error if incorrect params", async () => {
    const phone = { a: 1 };
    const response = await request.post(`${url}/issue`, {
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
