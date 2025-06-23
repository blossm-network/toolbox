import "localenv";
import * as chai from "chai";
import getToken from "@blossm/get-token";
import { decode } from "@blossm/jwt";
import gcpPubsub from "@blossm/gcp-pubsub";

import request from "@blossm/request";
import config from "./../../config.json" with { type: "json" };

const { views, testing } = config;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const root = "some-root";

const existingTopics = [];
describe("View gateway integration tests", () => {
  before(async () => {
    existingTopics.push(
      ...testing.topics.filter(async (t) => {
        return await gcpPubsub.exists(t);
      })
    );
    await Promise.all(testing.topics.map((t) => gcpPubsub.create(t)));
  });
  after(
    async () =>
      await Promise.all(
        [...testing.topics].map((t) => !existingTopics.includes(t) && gcpPubsub.del(t))
      )
  );
  it("should return successfully", async () => {
    const requiredPermissions = views.reduce((permissions, view) => {
      return !view.permissions || view.permissions == "none"
        ? permissions
        : [...new Set([...permissions, ...view.permissions])];
    }, []);

    const parallelFns = [];
    for (const view of views) {
      const needsToken =
        view.protection == undefined ||
        view.protection == "strict" ||
        typeof view.protection == "object";

      const { token } = needsToken
        ? await getToken({
            permissions: requiredPermissions,
            ...(typeof view.protection == "object" && {
              ...Object.keys(view.protection).reduce((result, key) => {
                result[key] = view.protection[key][0];
                return result;
              }, {}),
            }),
          })
        : {};
      parallelFns.push(async () => {
        //Channels are only available to contexts.
        if (!token) return;

        const {
          claims: { context: tokenContext },
        } = decode(token);

        //Test channel getting.
        const response = await request.get(`${url}`, {
          body: {
            query: {
              name: view.name,
            },
            context: tokenContext,
          },
        });
        expect(response.statusCode).to.equal(200);
      });
      parallelFns.push(async () => {
        const response0 = await request.get(`${url}/${view.name}`, {
          body: {
            root,
          },
          ...(view.protection === undefined ||
            (view.protection === "strict" && {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })),
        });
        expect(response0.statusCode).to.equal(200);
        expect(response0.statusCode).to.not.equal(401);
        expect(response0.statusCode).to.be.lessThan(500);
      });

      if (view.privileges == "none") continue;

      parallelFns.push(async () => {
        const response1 = await request.get(`${url}/${view.name}`, {
          body: {
            root,
          },
        });

        expect(response1.statusCode).to.equal(401);
      });

      parallelFns.push(async () => {
        const response2 = await request.get(`${url}/${view.name}`, {
          body: {
            root,
          },
          headers: {
            Authorization: "Bearer bogusHeader.bogusPayload.bogusSignature",
          },
        });

        expect(response2.statusCode).to.equal(401);
      });

      if (view.protection == "none") continue;

      parallelFns.push(async () => {
        const response3 = await request.get(`${url}`, {
          body: {
            query: {
              name: view.name,
            },
          },
        });
        expect(response3.statusCode).to.equal(401);
      });
    }

    await Promise.all(parallelFns);
  });
});
