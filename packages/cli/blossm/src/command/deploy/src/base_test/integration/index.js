import "localenv";
import * as chai from "chai";
import { string as dateString } from "@blossm/datetime";
import uuid from "@blossm/uuid";
import eventStore from "@blossm/event-store-rpc";
import createEvent from "@blossm/create-event";
import { hash } from "@blossm/crypt";
import config from "../../config.json" with { type: "json" };

import request from "@blossm/request";

const { expect } = chai;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const checkResponse = ({ data, expected, tokens, revokeKeys }) => {
  for (const property in {
    ...expected,
    ...(tokens && { _tokens: tokens }),
    ...(revokeKeys && { _revokeKeys: revokeKeys }),
  }) {
    expect(data[property]).to.exist;
    if (expected[property]) {
      if (
        typeof expected[property] == "object" &&
        !(expected[property] instanceof Array)
      ) {
        checkResponse({
          data: data[property],
          expected: expected[property],
        });
      } else if (expected[property] instanceof Array) {
        expect(data[property]).to.be.an("array");
        let i = 0;
        for (const expectedValue of expected[property]) {
          checkResponse({
            data: data[property][i],
            expected: expectedValue[i],
          });
          i++;
        }
      } else {
        expect(data[property]).to.deep.equal(expected[property]);
      }
    }
  }
};

const formattedPayload = async (payload) => {
  let result = {};
  for (const property in payload) {
    if (
      typeof payload[property] == "object" &&
      !(payload[property] instanceof Array)
    ) {
      result[property] = await formattedPayload(payload[property]);
    } else if (
      typeof payload[property] == "string" &&
      payload[property].startsWith("#")
    ) {
      result[property] = await hash(
        payload[property].substring(payload[property].indexOf("#") + 1)
      );
    } else {
      result[property] = payload[property];
    }
  }

  return result;
};
const executeStep = async (step) => {
  if (step.pre) {
    for (const {
      action,
      domain,
      service,
      root,
      payload = {},
      groupsAdded,
    } of step.pre) {
      const stateEvent = createEvent({
        root,
        payload: await formattedPayload(payload),
        action,
        domain,
        service,
        network: process.env.NETWORK,
        groupsAdded,
      });

      await eventStore({ domain, service }).add({
        eventData: [{ event: stateEvent }],
      });
    }
  }

  const necessaryContext = {};
  if (config.contexts) {
    for (const c of config.contexts) {
      necessaryContext[c] = "something";
    }
  }

  const response = await request.post(url, {
    body: {
      root: step.root,
      headers: {
        //In non-test environments, the command issuer sets the issued date.
        issued: dateString(),
        accepted: dateString(),
        //In non-test environments, a gateway adds an id.
        id: uuid(),
      },
      options: step.options,
      context: {
        ...necessaryContext,
        ...step.context,
      },
      tx: {
        ip: step.ip,
      },
      payload: step.payload,
      claims: step.claims,
    },
  });

  if (response.statusCode != step.code) {
    //eslint-disable-next-line no-console
    console.log("response: ", response);
  }

  expect(response.statusCode).to.equal(step.code);

  if (!step.response) return;

  checkResponse({
    expected: step.response,
    tokens: step.tokens,
    revokeKeys: step.revokeKeys,
    data: response.body,
  });
};

//TODO test for root: true config property
describe("Command handler integration tests", () => {
  it("should return successfully", async () => {
    if (config.contexts) {
      const response = await request.post(url, {
        body: {
          context: {},
        },
      });

      expect(response.statusCode).to.equal(403);
    }

    let i = 0;
    for (const step of config.testing.steps) {
      //eslint-disable-next-line no-console
      console.log("Executing step ", i++);
      await executeStep(step);
    }
  });

  it("should return an error if incorrect params", async () => {
    if (!config.testing.validate || !config.testing.validate.bad || !config.testing.validate.bad[0])
      return;

    const necessaryContext = {};
    if (config.contexts) {
      for (const c of config.contexts) {
        necessaryContext[c] = "something";
      }
    }

    console.log({
      badPayload: createBadPayload({
        bad: config.testing.validate.bad[0],
        ok: config.testing.validate.ok[0],
      })
    });

    const response = await request.post(url, {
      body: {
        headers: {
          issued: dateString(),
          accepted: dateString(),
          id: uuid(),
        },
        payload: createBadPayload({
          bad: config.testing.validate.bad[0],
          ok: config.testing.validate.ok[0],
        }),
        context: necessaryContext,
        claims: {
          iss: "some-iss",
          aud: "some-aud",
        },
      },
    });

    expect(response.statusCode).to.equal(409);
  });
});

const createBadPayload = ({ bad, ok }) => {
  let payload = { ...bad };

  for (const property in ok) {
    payload[property] =
      bad[property] != undefined
        ? typeof ok[property] == "object" &&
          !(ok[property] instanceof Array) &&
          typeof bad[property] == "object" &&
          !(bad[property] instanceof Array)
          ? createBadPayload({
              bad: bad[property],
              ok: ok[property],
            })
          : (payload[property] = bad[property])
        : (payload[property] = ok[property]);
  }

  return payload;
};
