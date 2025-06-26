import "localenv";
import * as chai from "chai";
import getToken from "@blossm/get-token";
import gcpPubsub from "@blossm/gcp-pubsub";

import request from "@blossm/request";
import config from "./../../config.json" with { type: "json" };

chai.use(sinonChai);
chai.use(chaiDatetime);
const { expect } = chai;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const root = "some-root";

const existingTopics = [];
describe("Fact gateway integration tests", () => {
  before(async () => {
    existingTopics.push(
      ...config.testing.topics.filter(async (t) => {
        return await gcpPubsub.exists(t);
      })
    );
    await Promise.all(config.testing.topics.map((t) => gcpPubsub.create(t)));
  });
  after(
    async () =>
      await Promise.all(
        [...config.testing.topics].map((t) => !existingTopics.includes(t) && gcpPubsub.del(t))
      )
  );
  it("should return successfully", async () => {
    const requiredPermissions = config.facts.reduce((permissions, command) => {
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
    for (const fact of config.facts) {
      const needsToken =
        fact.protection == undefined ||
        fact.protection == "strict" ||
        typeof fact.protection == "object";

      const { token } = needsToken
        ? await getToken({
            permissions: requiredPermissions,
            ...(typeof fact.protection == "object" && {
              ...Object.keys(fact.protection).reduce((result, key) => {
                result[key] = fact.protection[key][0];
                return result;
              }, {}),
            }),
          })
        : {};
      parallelFns.push(async () => {
        const response0 = await request.get(`${url}/${fact.name}`, {
          body: {
            root,
          },
          ...(fact.protection === undefined ||
            (fact.protection === "strict" && {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })),
        });
        expect(response0.statusCode).to.not.equal(401);
        expect(response0.statusCode).to.be.lessThan(500);
      });

      if (fact.privileges == "none") continue;

      parallelFns.push(async () => {
        const response1 = await request.get(`${url}/${fact.name}`, {
          body: {
            root,
          },
        });

        expect(response1.statusCode).to.equal(401);
      });

      parallelFns.push(async () => {
        const response2 = await request.get(`${url}/${fact.name}`, {
          body: {
            root,
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
