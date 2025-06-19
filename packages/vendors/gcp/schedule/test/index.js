import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake } from "sinon";

import { create, __client } from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

const parent = "some-parent";
const response = "some-response";
const url = "some-url";
const data = { a: 1 };
const scheduleString = "some-schedule";
const timeZone = "some-time-zone";
const project = "some-project";
const location = "some-location";
const token = "some-token";

describe("Schedule", () => {
  afterEach(() => {
    restore();
  });

  it("should call create with the correct params", async () => {
    const locationPathFake = fake.returns(parent);
    const createJobFake = fake.returns([response]);
    replace(__client, "locationPath", locationPathFake);
    replace(__client, "createJob", createJobFake);
    const result = await create({
      url,
      data,
      schedule: scheduleString,
      token,
      timeZone,
      project,
      location,
    });
    expect(locationPathFake).to.have.been.calledWith(project, location);
    expect(createJobFake).to.have.been.calledWith({
      parent,
      job: {
        httpTarget: {
          uri: url,
          httpMethod: "POST",
          oauthToken: token,
          body: Buffer.from(JSON.stringify(data)),
        },
        schedule: scheduleString,
        timeZone,
      },
    });
    expect(result).to.equal(response);
  });
});
