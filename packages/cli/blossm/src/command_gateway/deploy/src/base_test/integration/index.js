require("localenv");
const { expect } = require("chai");
const { string: dateString } = require("@blossm/datetime");
const getToken = require("@blossm/get-token");
const { create, delete: del, exists } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");
const { commands, testing } = require("./../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const existingTopics = [];
describe("Command gateway integration tests", () => {
  before(async () => {
    existingTopics.push(
      ...testing.topics.filter(async t => {
        return await exists(t);
      })
    );
    await Promise.all(testing.topics.map(t => create(t)));
  });
  after(
    async () =>
      await Promise.all(
        [...testing.topics].map(t => !existingTopics.includes(t) && del(t))
      )
  );
  it("should return successfully", async () => {
    const requiredPermissions = commands.reduce((permissions, command) => {
      return command.privileges == "none"
        ? permissions
        : [
            ...new Set([
              ...permissions,
              ...(command.privileges
                ? command.privileges.map(privilege => {
                    return {
                      privilege,
                      domain: process.env.DOMAIN,
                      service: process.env.SERVICE
                    };
                  })
                : [])
            ])
          ];
    }, []);

    const needsToken = commands.some(
      c => c.protection == undefined || c.protection == "strict"
    );

    const { token } = needsToken
      ? await getToken({ permissions: requiredPermissions })
      : {};

    const parallelFns = [];
    for (const command of commands) {
      parallelFns.push(async () => {
        const response0 = await request.post(`${url}/${command.action}`, {
          body: {
            headers: {
              issued: dateString(),
              accepted: dateString()
            },
            payload: {}
          },
          ...(command.protection === undefined ||
            (command.protection === "strict" && {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }))
        });

        expect(response0.statusCode).to.not.equal(401);
        expect(response0.statusCode).to.be.lessThan(500);
      });

      if (command.permissions == "none") continue;

      parallelFns.push(async () => {
        const response1 = await request.post(`${url}/${command.action}`, {
          body: {
            headers: {
              issued: dateString(),
              accepted: dateString()
            },
            payload: {}
          }
        });

        expect(response1.statusCode).to.equal(401);
      });

      parallelFns.push(async () => {
        const response2 = await request.post(`${url}/${command.action}`, {
          body: {
            headers: {
              issued: dateString(),
              accepted: dateString()
            },
            payload: {}
          },
          headers: {
            Authorization: "Bearer bogusHeader.bogusPayload.bogusSignature"
          }
        });

        expect(response2.statusCode).to.equal(401);
      });
    }

    await Promise.all(parallelFns);
  });
});
