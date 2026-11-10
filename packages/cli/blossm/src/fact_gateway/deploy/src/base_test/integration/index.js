import "localenv";
import * as chai from "chai";
import getToken, { gatewayTokenOptions } from "@blossm/get-token";
import gcpPubsub from "@blossm/gcp-pubsub";

import request from "@blossm/request";
import config from "./../../config.json" with { type: "json" };

const { expect } = chai;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const root = "some-root";

const existingTopics = [];
describe("Fact gateway integration tests", () => {
  before(async () => {
    const existence = await Promise.all(
      config.testing.topics.map((topic) => gcpPubsub.exists(topic)),
    );
    existingTopics.push(
      ...config.testing.topics.filter((_, i) => existence[i]),
    );
    await Promise.all(config.testing.topics.map((t) => gcpPubsub.create(t)));
  });
  after(
    async () =>
      await Promise.all(
        [...config.testing.topics].map(
          (t) => !existingTopics.includes(t) && gcpPubsub.del(t),
        ),
      ),
  );
  it("should return successfully", async () => {
    const parallelFns = [];
    for (const fact of config.facts) {
      const tokenOptions = gatewayTokenOptions(fact, {
        context: config.testing.context,
        contextName: config.context,
      });
      const needsToken = tokenOptions !== undefined;
      const { token } = needsToken ? await getToken(tokenOptions) : {};
      parallelFns.push(async () => {
        const response0 = await request.get(`${url}/${fact.name}`, {
          query: {
            root,
          },
          ...(needsToken && {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        });
        expect(response0.statusCode).to.not.equal(401);
        expect(response0.statusCode).to.be.lessThan(500);
      });

      if (!needsToken) continue;

      parallelFns.push(async () => {
        const response1 = await request.get(`${url}/${fact.name}`, {
          query: {
            root,
          },
        });

        expect(response1.statusCode).to.equal(401);
      });

      parallelFns.push(async () => {
        const response2 = await request.get(`${url}/${fact.name}`, {
          query: {
            root,
          },
          headers: {
            Authorization: "Bearer bogusHeader.bogusPayload.bogusSignature",
          },
        });

        expect(response2.statusCode).to.equal(401);
      });
    }

    await Promise.all(parallelFns.map((fn) => fn()));
  });
});
