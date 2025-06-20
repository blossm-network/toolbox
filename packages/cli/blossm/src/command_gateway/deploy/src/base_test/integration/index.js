import "localenv";
import * as chai from "chai";
import { string as dateString } from "@blossm/datetime";
import getToken from "@blossm/get-token";
import { create, delete as del, exists } from "@blossm/gcp-pubsub";

import request from "@blossm/request";
import config from "./../../config.json" with { type: "json" };

const { commands, testing } = config;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const existingTopics = [];
describe("Command gateway integration tests", () => {
  before(async () => {
    existingTopics.push(...testing.topics.filter((t) => exists(t)));
    await Promise.all(testing.topics.map((t) => create(t)));
  });
  after(
    async () =>
      await Promise.all(
        [...testing.topics].map((t) => !existingTopics.includes(t) && del(t))
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
                ? command.privileges.map((privilege) => {
                    return {
                      privilege,
                      domain: process.env.DOMAIN,
                      service: process.env.SERVICE,
                    };
                  })
                : []),
            ]),
          ];
    }, []);

    const parallelFns = [];
    for (const command of commands) {
      parallelFns.push(async () => {
        const needsToken =
          command.protection == undefined ||
          command.protection == "strict" ||
          typeof command.protection == "object";

        const { token } = needsToken
          ? await getToken({
              permissions: requiredPermissions,
              ...(typeof command.protection == "object" && {
                ...Object.keys(command.protection).reduce((result, key) => {
                  result[key] = command.protection[key][0];
                  return result;
                }, {}),
              }),
            })
          : {};

        const response0 = await request.post(`${url}/${command.action}`, {
          body: {
            headers: {
              issued: dateString(),
              accepted: dateString(),
            },
            payload: {},
          },
          ...(command.protection === undefined ||
            (command.protection === "strict" && {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })),
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
              accepted: dateString(),
            },
            payload: {},
          },
        });

        expect(response1.statusCode).to.equal(401);
      });

      parallelFns.push(async () => {
        const response2 = await request.post(`${url}/${command.action}`, {
          body: {
            headers: {
              issued: dateString(),
              accepted: dateString(),
            },
            payload: {},
          },
          headers: {
            Authorization: "Bearer bogusHeader.bogusPayload.bogusSignature",
          },
        });

        expect(response2.statusCode).to.equal(401);
      });
    }

    await Promise.all(parallelFns);
  });
});
