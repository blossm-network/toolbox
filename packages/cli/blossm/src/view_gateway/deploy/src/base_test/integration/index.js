import "localenv";
import * as chai from "chai";
import getToken, { gatewayTokenOptions } from "@blossm/get-token";
import { decode } from "@blossm/jwt";
import gcpPubsub from "@blossm/gcp-pubsub";

import request from "@blossm/request";
import config from "./../../config.json" with { type: "json" };

const { expect } = chai;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const root = "some-root";

const existingTopics = [];
describe("View gateway integration tests", () => {
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
    for (const view of config.views) {
      const tokenOptions = gatewayTokenOptions(view, {
        context: config.testing.context,
        contextName: config.context,
      });
      const needsToken = tokenOptions !== undefined;
      const { token } = needsToken ? await getToken(tokenOptions) : {};
      const tokenContext = token ? decode(token).claims.context : {};
      const missingContext = config.context && !tokenContext[config.context];
      const strict =
        view.protection === undefined || view.protection === "strict";
      const emptyPermissions =
        Array.isArray(view.permissions) && view.permissions.length === 0;
      parallelFns.push(async () => {
        // Channel discovery uses explicit query context, not Bearer authentication.
        const response = await request.get(url, {
          query: { name: view.name, context: tokenContext },
        });
        expect(response.statusCode).to.equal(
          strict && emptyPermissions ? 401 : missingContext ? 403 : 200,
        );
      });
      parallelFns.push(async () => {
        const response0 = await request.get(`${url}/${view.name}`, {
          query: {
            root,
          },
          ...(needsToken && {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        });
        expect(response0.statusCode).to.equal(
          strict && emptyPermissions ? 401 : missingContext ? 403 : 200,
        );
      });

      // A strict permission policy needs a principal in the supplied context.
      // Omitted permissions and non-strict discovery support contextless calls.
      if (
        !view.permissions ||
        (view.protection && view.protection !== "strict")
      ) {
        parallelFns.push(async () => {
          const response = await request.get(url, {
            query: { name: view.name },
          });
          expect(response.statusCode).to.equal(config.context ? 403 : 200);
        });
      }

      if (!needsToken) continue;

      parallelFns.push(async () => {
        const response1 = await request.get(`${url}/${view.name}`, {
          query: {
            root,
          },
        });

        expect(response1.statusCode).to.equal(401);
      });

      parallelFns.push(async () => {
        const response2 = await request.get(`${url}/${view.name}`, {
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
