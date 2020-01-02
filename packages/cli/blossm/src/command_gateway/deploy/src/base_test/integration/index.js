require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const getToken = require("@blossm/get-token");
const { create, delete: del } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");
const { commands, topics } = require("./../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Command gateway integration tests", () => {
  before(async () => await Promise.all(topics.map(t => create(t))));
  after(async () => await Promise.all(topics.map(t => del(t))));
  it("should return successfully", async () => {
    const requiredPermissions = commands.reduce((permissions, command) => {
      return command.priviledges == "none"
        ? permissions
        : [
            ...new Set([
              ...permissions,
              ...command.priviledges.map(
                priviledge => `${process.env.DOMAIN}:${priviledge}`
              )
            ])
          ];
    }, []);

    const { token } = await getToken({ permissions: requiredPermissions });

    for (const command of commands) {
      const response0 = await request.post(`${url}/${command.action}`, {
        body: {
          headers: {
            issued: stringDate()
          },
          payload: {}
        },
        ...(command.priviledges != "none" && {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      });

      expect(response0.statusCode).to.not.equal(401);
      expect(response0.statusCode).to.be.lessThan(500);

      if (command.priviledges == "none") return;
      const response1 = await request.post(`${url}/${command.action}`, {
        body: {
          headers: {
            issued: stringDate()
          },
          payload: {}
        }
      });

      expect(response1.statusCode).to.equal(401);

      const response2 = await request.post(`${url}/${command.action}`, {
        body: {
          headers: {
            issued: stringDate()
          },
          payload: {}
        },
        headers: {
          Authorization: "Bearer bogusHeader.bogusPayload.bogusSignature"
        }
      });

      expect(response2.statusCode).to.equal(401);
    }
  });
});
