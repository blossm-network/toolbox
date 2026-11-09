import checkResponse from "../assert_response.js";
import "localenv";
import * as chai from "chai";
import eventStore from "@blossm/event-store-rpc";
import createEvent from "@blossm/create-event";
import { hash } from "@blossm/crypt";
import request from "@blossm/request";
import config from "./../../config.json" with { type: "json" };

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

const { expect } = chai;


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
      payload,
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
  const response = await request.get(
    `${url}${step.root ? `/${step.root}` : ""}`,
    {
      query: {
        context: { ...necessaryContext, ...step.context },
        query: step.query || {},
        ...(step.claims && { claims: step.claims }),
      },
    }
  );

  const correctCode = step.response != undefined ? 200 : step.code;
  if (response.statusCode != correctCode) {
    //eslint-disable-next-line no-console
    console.log("response: ", response);
  }

  expect(response.statusCode).to.equal(correctCode);

  if (step.response == undefined) return;

  const parsedBody = JSON.parse(response.body);

  checkResponse({
    expected: step.response,
    data: parsedBody,
  });
};

describe("Fact integration tests", () => {
  it("should return successfully", async () => {
    let i = 0;
    for (const step of config.testing.steps) {
      //eslint-disable-next-line no-console
      console.log("Executing step ", i++);
      await executeStep(step);
    }
  });
});
