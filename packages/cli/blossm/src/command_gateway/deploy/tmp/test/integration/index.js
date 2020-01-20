require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const getToken = require("@blossm/get-token");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("../../config.json");

describe("Command gateway integration tests", () => {
  before(async () => await Promise.all(testing.topics.map(t => create(t))));
  after(async () => await Promise.all(testing.topics.map(t => del(t))));
  it("should return successfully", async () => {
    const issueFn = async ({ phone, token: anonymousToken }) => {
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
      return { token };
    };
    const answerFn = async ({ code, token }) => {
      const response = await request.post(`${url}/answer`, {
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
      console.log("33 response: ", response);
      expect(response.statusCode).to.equal(200);
      const { token: newToken } = JSON.parse(response.body);
      return { token: newToken };
    };
    const { token } = await getToken({
      issueFn,
      answerFn
    });
    expect(token).to.exist;
  });
});
