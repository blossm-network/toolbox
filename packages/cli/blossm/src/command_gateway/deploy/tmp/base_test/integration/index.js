require("localenv");
const { expect } = require("chai");
const { string: stringDate } = require("@blossm/datetime");
const getToken = require("@blossm/get-token");

const request = require("@blossm/request");
const { commands } = require("./../../config.json");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Command gateway integration tests", () => {
  it("should return successfully", async () => {
    const requiredPriviledges = commands.reduce((privs, command) => {
      return command.priviledges == "none"
        ? privs
        : [...privs, command.priviledges];
    }, []);

    const token = await getToken({ priviledges: requiredPriviledges });

    for (const command of commands) {
      const response0 = await request.post(
        `${url}/${command.action}`,
        {
          body: {
            headers: {
              issued: stringDate()
            },
            payload: {}
          }
        },
        ...(command.priviledges != "none" && {
          authorization: `Bearer ${token}`
        })
      );

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

      const response2 = await request.post(
        `${url}/${command.action}`,
        {
          body: {
            headers: {
              issued: stringDate()
            },
            payload: {}
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
