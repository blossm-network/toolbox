require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const getToken = require("@blossm/get-token");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { testing } = require("./../../config.json");

describe("Command gateway integration tests", () => {
  //eslint-disable-next-line
  console.log("targets: ", testing.topics);
  before(async () => {
    //eslint-disable-next-line
    console.log("before 3");
    await Promise.all(testing.topics.map(t => create(t)));
    //eslint-disable-next-line
    console.log("before 4");
  });
  after(async () => {
    //eslint-disable-next-line
    console.log("after 3");
    await Promise.all(testing.topics.map(t => del(t)));
    //eslint-disable-next-line
    console.log("after 4");
  });

  it("should return successfully", async () => {
    const issueFn = async ({ phone }) => {
      //eslint-disable-next-line
      console.log("hittin up issue: ", { phone });
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
      console.log("done issuing: ", { token, root });
      return { token, root };
    };
    const answerFn = async ({ code, root, token }) => {
      //eslint-disable-next-line
      console.log("hittin up answer: ", { code, root, token });
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
      expect(response.statusCode).to.equal(200);
      const { token: newToken } = JSON.parse(response.body);

      //eslint-disable-next-line
      console.log("done answering: ", { token });
      return { root, token: newToken };
    };

    //eslint-disable-next-line
    console.log("doin it");
    const { token, root } = await getToken({
      issueFn,
      answerFn
    });

    //eslint-disable-next-line
    console.log("dun did it: ", { token, root });
    expect(root).to.exist;
    expect(token).to.exist;
  });
});
