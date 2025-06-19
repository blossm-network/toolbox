import "localenv";
import * as chai from "chai";
import { string as dateString } from "@blossm/datetime";
import request from "@blossm/request";

const { expect } = chai;

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Job integration tests", () => {
  it("should return successfully", async () => {
    const name = "A-name";
    const response = await request.post(url, {
      body: {
        headers: {
          issued: dateString(),
          accepted: dateString(),
        },
        payload: {
          name,
        },
      },
    });

    expect(response.statusCode).to.equal(204);
  });
});
