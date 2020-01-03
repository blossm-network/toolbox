require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const getToken = require("@blossm/get-token");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("./../../config.json");

describe("Command gateway integration tests", () => {
  before(async () => await Promise.all(testing.topics.map(t => create(t))));
  after(async () => await Promise.all(testing.topics.map(t => del(t))));
  it("should return successfully", async () => {
    const issueFn = async ({ phone }) => {
      //eslint-disable-next-line
      console.log("bout to issue: ", { phone });
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
      expect(response.statusCode).to.equal(200);
      const { token, root } = JSON.parse(response.body);
      //eslint-disable-next-line
      console.log("dun issuing: ", { token, root });
      return { token, root };
    };
    const answerFn = async ({ code, root, token }) => {
      //eslint-disable-next-line
      console.log("bout to answer: ", { code, root, token });
      const response = await request.post(`${url}/answer`, {
        body: {
          root,
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
      console.log("body: ", { body: JSON.parse(response.body) });
      expect(response.statusCode).to.equal(200);
      const { token: newToken } = JSON.parse(response.body);
      //eslint-disable-next-line
      console.log("dun answering: ", { token });
      return { root, token: newToken };
    };
    const { token, root } = await getToken({
      issueFn,
      answerFn
    });
    expect(root).to.exist;
    expect(token).to.exist;
  });
});
