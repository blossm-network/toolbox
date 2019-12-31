require("localenv");
const { expect } = require("chai");
const getToken = require("@blossm/get-token");

const request = require("@blossm/request");
const { stores } = require("./../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const root = "some-root";

describe("View gateway integration tests", () => {
  it("should return successfully", async () => {
    const requiredPriviledges = stores.reduce((privs, command) => {
      return command.priviledges == "none"
        ? privs
        : [...privs, command.priviledges];
    }, []);

    const token = await getToken({ priviledges: requiredPriviledges });

    for (const store of stores) {
      const response0 = await request.get(
        `${url}/${store.name}`,
        {
          body: {
            root
          }
        },
        ...(store.priviledges != "none" && {
          authorization: `Bearer ${token}`
        })
      );

      expect(response0.statusCode).to.not.equal(401);
      expect(response0.statusCode).to.be.lessThan(500);

      if (store.priviledges == "none") return;
      const response1 = await request.get(`${url}/${store.action}`, {
        body: {
          root
        }
      });

      expect(response1.statusCode).to.equal(401);

      const response2 = await request.get(
        `${url}/${store.name}`,
        {
          body: {
            root
          }
        },
        {
          authorization: "Bearer bogus"
        }
      );

      expect(response2.statusCode).to.equal(401);
    }
  });
});
