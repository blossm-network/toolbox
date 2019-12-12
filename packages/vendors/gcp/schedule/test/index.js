const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");
const gcp = require("@google-cloud/scheduler");

let schedule;

const parent = "some-parent";
const response = "some-response";
const locationPathFake = fake.returns(parent);
const createJobFake = fake.returns([response]);
const url = "some-url";
const data = { a: 1 };
const scheduleString = "some-schedule";
const timeZone = "some-time-zone";
const project = "some-project";
const location = "some-location";
const token = "some-token";

describe("Schedule", () => {
  before(() => {
    const client = function() {};
    client.prototype.locationPath = locationPathFake;
    client.prototype.createJob = createJobFake;

    replace(gcp, "CloudSchedulerClient", client);

    schedule = require("..");
  });
  after(() => {
    restore();
  });

  it("should call create with the correct params", async () => {
    const result = await schedule({
      url,
      data,
      schedule: scheduleString,
      token,
      timeZone,
      project,
      location
    });
    expect(locationPathFake).to.have.been.calledWith(project, location);
    expect(createJobFake).to.have.been.calledWith({
      parent,
      job: {
        httpTarget: {
          uri: url,
          httpMethod: "POST",
          oauthToken: token,
          body: Buffer.from(JSON.stringify(data))
        },
        schedule: scheduleString,
        timeZone
      }
    });
    expect(result).to.equal(response);
  });
});
