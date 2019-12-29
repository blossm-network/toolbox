require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const uuid = require("@blossm/uuid");
const { create, delete: del } = require("@blossm/gcp-pubsub");
const getToken = require("@blossm/get-token");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const config = require("./../../config.json");

describe("Command handler store integration tests", () => {
  before(async () => await Promise.all(config.topics.map(t => create(t))));
  after(async () => await Promise.all(config.topics.map(t => del(t))));

  it("should return successfully", async () => {
    const answerFn = async ({ code, root, person }) => {
      const response = await request.post(url, {
        body: {
          root,
          headers: {
            issued: stringDate(),
            id: uuid()
          },
          payload: {
            code
          },
          context: {
            challenge: root,
            person
          }
        }
      });

      expect(response.statusCode).to.equal(200);
      const { token: newToken } = JSON.parse(response.body);

      expect(newToken).to.exist;
      return { root, token: newToken };
    };

    const { token, root } = await getToken({
      answerFn
    });

    expect(token).to.exist;
    expect(root).to.exist;
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
