require("localenv");
const { expect } = require("chai");
const getToken = require("@blossm/get-token");
const { create, delete: del, exists } = require("@blossm/gcp-pubsub");

const request = require("@blossm/request");
const { stores, testing } = require("./../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const root = "some-root";

const existingTopics = [];
describe("View gateway integration tests", () => {
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
    const requiredPermissions = stores.reduce((permissions, command) => {
      return command.priviledges == "none"
        ? permissions
        : [
            ...new Set([
              ...permissions,
              ...(command.priviledges
                ? command.priviledges.map(priviledge => {
                    return {
                      priviledge,
                      domain: process.env.DOMAIN,
                      service: process.env.SERVICE
                    };
                  })
                : [])
            ])
          ];
    }, []);

    const { token } = await getToken({ permissions: requiredPermissions });

    const parallelFns = [];
    for (const store of stores) {
      parallelFns.push(async () => {
        const response0 = await request.get(`${url}/${store.name}`, {
          body: {
            root
          },
          ...(store.protected === undefined ||
            (store.protected === true && {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }))
        });
        expect(response0.statusCode).to.not.equal(401);
        expect(response0.statusCode).to.be.lessThan(500);
      });

      if (store.priviledges == "none") continue;

      parallelFns.push(async () => {
        const response1 = await request.get(`${url}/${store.name}`, {
          body: {
            root
          }
        });

        expect(response1.statusCode).to.equal(401);
      });

      parallelFns.push(async () => {
        const response2 = await request.get(`${url}/${store.name}`, {
          body: {
            root
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
